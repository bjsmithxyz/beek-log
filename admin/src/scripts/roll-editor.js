import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { filmStocks } from '@beek/shared/film-stocks';
import { parseFolderName } from '@beek/shared/folder-name';
import { fillForward, knownLocations } from '@beek/shared/loc-utils';
import { rollInputErrors } from '@beek/shared/roll-markdown';
import { deriveSlug, slugify } from '@beek/shared/slug';
import { encodeFiles, releaseFrameUrls } from '../lib/image-encoder.js';
import { storeBytes } from '../lib/store-bytes.js';
import { uploaderCapabilities } from '../lib/uploader-capabilities.mjs';

const root = document.getElementById('roll-editor-root');
const mode = root.dataset.mode;
const routeSlug = root.dataset.slug;
const publicationKey = 'beek-admin-roll-publication';
const endpoints = {
  roll: '/.netlify/functions/roll-data',
  publish: '/.netlify/functions/publish-roll',
  status: '/.netlify/functions/publish-status',
  merge: '/.netlify/functions/publish-merge',
  abandon: '/.netlify/functions/publish-abandon',
  geocode: '/.netlify/functions/geocode',
};

let frames = [];
let source = null;
let rollLocation = null;
let originalFingerprint = null;
let slugManual = mode === 'edit';
let pendingDelete = false;
let pendingRequestId = null;
let publication = restorePublication();
let pollTimer = null;
let pollAttempts = 0;
let pickerRegion = null;
let locationApply = null;
let map = null;
let marker = null;

const form = document.getElementById('roll-form');
const statusNode = document.getElementById('roll-status');
const frameGrid = document.getElementById('frame-grid');
const frameCount = document.getElementById('frame-count');
const reviewButton = document.getElementById('review-roll');
const reviewPanel = document.getElementById('roll-review');
const reviewSummary = document.getElementById('roll-review-summary');
const errorsPanel = document.getElementById('roll-errors');
const errorsList = document.getElementById('roll-error-list');
const publicationPanel = document.getElementById('roll-publication');
const publicationStatus = document.getElementById('roll-publication-status');
const publicationPr = document.getElementById('roll-pr');
const publicationPreview = document.getElementById('roll-preview');
const mergeButton = document.getElementById('merge-roll-publication');
const uploadProgress = document.getElementById('upload-progress');

const fields = {
  title: document.getElementById('roll-title'),
  stock: document.getElementById('roll-stock'),
  date: document.getElementById('roll-date'),
  iso: document.getElementById('roll-iso'),
  slug: document.getElementById('roll-slug'),
  draft: document.getElementById('roll-draft'),
  body: document.getElementById('roll-body'),
};

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = body.code;
    throw error;
  }
  return body;
}

function post(url, body) {
  return api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setStatus(message) {
  statusNode.textContent = message;
}

function setErrors(errors) {
  errorsList.replaceChildren(...errors.map((message) => {
    const item = document.createElement('li');
    item.textContent = message;
    return item;
  }));
  errorsPanel.hidden = errors.length === 0;
}

function restorePublication() {
  try {
    const value = JSON.parse(sessionStorage.getItem(publicationKey) || 'null');
    if (Number.isSafeInteger(value?.number) && /^[0-9a-f]{40}$/.test(value?.headSha || '')) return value;
  } catch {
    // Discard malformed local status hints.
  }
  sessionStorage.removeItem(publicationKey);
  return null;
}

function savePublication(value) {
  publication = value;
  if (value) sessionStorage.setItem(publicationKey, JSON.stringify(value));
  else sessionStorage.removeItem(publicationKey);
}

function displayLocation(value) {
  return value ? `${value.name}${value.region ? ` · ${value.region.name}` : ''}` : '(none set)';
}

function currentRoll() {
  return {
    slug: slugify(fields.slug.value),
    title: fields.title.value.trim(),
    stock: fields.stock.value,
    date: fields.date.value,
    location: rollLocation,
    draft: fields.draft.checked,
    body: fields.body.value,
    frames: frames.map((frame) => ({
      blobSha: frame.blobSha,
      alt: frame.alt || '',
      ...(frame.caption ? { caption: frame.caption } : {}),
      ...(frame.location ? { location: frame.location } : {}),
    })),
  };
}

function fingerprint() {
  const roll = currentRoll();
  roll.frames = frames.map((frame) => ({
    identity: frame.blobSha || frame.localId,
    alt: frame.alt || '',
    caption: frame.caption || '',
    location: frame.location || null,
  }));
  return JSON.stringify(roll);
}

function updateReady() {
  if (!frames.length) {
    reviewButton.disabled = true;
  } else if (mode === 'edit' && originalFingerprint === fingerprint()) {
    reviewButton.disabled = true;
  } else {
    reviewButton.disabled = Boolean(publication);
  }
  reviewPanel.hidden = true;
  setErrors([]);
}

function refreshSlug(force = false) {
  if (slugManual && !force) return;
  const primary = rollLocation || frames.find((frame) => frame.location)?.location;
  fields.slug.value = deriveSlug({
    date: fields.date.value,
    stockSlug: fields.stock.value,
    placeName: primary?.name || '',
  });
}

function renderLocation() {
  document.getElementById('roll-location-display').textContent = displayLocation(rollLocation);
  refreshSlug();
}

function frameLocation(frame) {
  return frame.location || rollLocation;
}

function renderFrames() {
  frameCount.textContent = `(${frames.length})`;
  frameGrid.innerHTML = frames.map((frame, index) => `
    <article class="roll-frame" draggable="true" data-index="${index}">
      <div class="frame-head">
        <label class="frame-select"><input type="checkbox" data-select ${frame.selected ? 'checked' : ''}><span class="frame-number">#${String(index + 1).padStart(3, '0')}</span></label>
        <div class="frame-actions">
          <button type="button" data-action="left" aria-label="Move frame ${index + 1} left" ${index === 0 ? 'disabled' : ''}>←</button>
          <button type="button" data-action="right" aria-label="Move frame ${index + 1} right" ${index === frames.length - 1 ? 'disabled' : ''}>→</button>
          <button type="button" data-action="location" aria-label="Set frame ${index + 1} location">⌖</button>
          <button type="button" data-action="remove" aria-label="Remove frame ${index + 1}">×</button>
        </div>
      </div>
      <img class="frame-image" data-preview src="${escapeHtml(frame.thumbUrl)}" alt="" referrerpolicy="no-referrer" tabindex="0">
      <div class="frame-fields">
        <input data-field="alt" maxlength="500" placeholder="alt text (optional)" value="${escapeHtml(frame.alt || '')}">
        <input data-field="caption" maxlength="1000" placeholder="caption (optional)" value="${escapeHtml(frame.caption || '')}">
        <div class="frame-location">⌖ ${escapeHtml(displayLocation(frameLocation(frame)))}</div>
      </div>
    </article>
  `).join('');
}

function moveFrame(from, to) {
  if (from < 0 || to < 0 || from >= frames.length || to >= frames.length || from === to) return;
  const [frame] = frames.splice(from, 1);
  frames.splice(to, 0, frame);
  renderFrames();
  updateReady();
  frameGrid.querySelector(`[data-index="${to}"] [data-preview]`)?.focus();
}

frameGrid.addEventListener('input', (event) => {
  const card = event.target.closest('.roll-frame');
  if (!card) return;
  const frame = frames[Number(card.dataset.index)];
  if (event.target.matches('[data-select]')) frame.selected = event.target.checked;
  if (event.target.matches('[data-field]')) frame[event.target.dataset.field] = event.target.value;
  updateReady();
});

frameGrid.addEventListener('click', async (event) => {
  const card = event.target.closest('.roll-frame');
  if (!card) return;
  const index = Number(card.dataset.index);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'left') moveFrame(index, index - 1);
  if (action === 'right') moveFrame(index, index + 1);
  if (action === 'remove') {
    if (!confirm(`Remove frame ${index + 1} from this roll?`)) return;
    releaseFrameUrls(frames[index]);
    frames.splice(index, 1);
    renderFrames();
    updateReady();
  }
  if (action === 'location') {
    openLocationPicker(frameLocation(frames[index]), (value) => {
      fillForward(frames, index, value);
      renderFrames();
      refreshSlug();
      updateReady();
    });
  }
  if (event.target.matches('[data-preview]')) openImagePreview(frames[index]);
});

frameGrid.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-preview]')) {
    event.preventDefault();
    const index = Number(event.target.closest('.roll-frame').dataset.index);
    openImagePreview(frames[index]);
  }
});

frameGrid.addEventListener('dragstart', (event) => {
  const card = event.target.closest('.roll-frame');
  if (card) event.dataTransfer.setData('text/plain', card.dataset.index);
});
frameGrid.addEventListener('dragover', (event) => {
  const card = event.target.closest('.roll-frame');
  if (!card) return;
  event.preventDefault();
  card.classList.add('dragover');
});
frameGrid.addEventListener('dragleave', (event) => event.target.closest('.roll-frame')?.classList.remove('dragover'));
frameGrid.addEventListener('drop', (event) => {
  const card = event.target.closest('.roll-frame');
  if (!card) return;
  event.preventDefault();
  card.classList.remove('dragover');
  moveFrame(Number(event.dataTransfer.getData('text/plain')), Number(card.dataset.index));
});

async function filesFromDirectory(handle) {
  const files = [];
  async function walk(directory) {
    for await (const entry of directory.values()) {
      if (entry.kind === 'directory') await walk(entry);
      else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) files.push(await entry.getFile());
    }
  }
  await walk(handle);
  return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

async function pickFolder() {
  try {
    const handle = await showDirectoryPicker({ mode: 'read' });
    const files = await filesFromDirectory(handle);
    if (!files.length) throw new Error('No browser-decodable JPEG, PNG, or WebP images found.');
    const parsed = parseFolderName(handle.name, filmStocks);
    if (parsed.date) fields.date.value = parsed.date;
    if (parsed.stockSlug) fields.stock.value = parsed.stockSlug;
    fields.iso.value = parsed.iso || '';
    setStatus(`Encoding ${files.length} scans locally with MozJPEG…`);
    const progress = document.getElementById('encode-progress');
    const label = document.getElementById('encode-label');
    const encoded = await encodeFiles(files, {
      onProgress(update) {
        progress.style.width = `${Math.round(update.complete / update.total * 100)}%`;
        label.textContent = `${update.complete}/${update.total} · ${update.name}`;
      },
    });
    encoded.forEach((result) => {
      const bytes = new Uint8Array(result.encoded);
      const thumbBlob = new Blob([result.thumb], { type: 'image/jpeg' });
      frames.push({
        localId: crypto.randomUUID(),
        blobSha: null,
        encoded: bytes,
        thumbUrl: URL.createObjectURL(thumbBlob),
        previewUrl: URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })),
        alt: '', caption: '', location: null, explicit: false, selected: false,
        width: result.width, height: result.height, sourceName: result.name,
      });
    });
    progress.style.width = '100%';
    label.textContent = `${files.length} scans encoded; originals stayed on this device.`;
    refreshSlug();
    renderFrames();
    updateReady();
    setStatus(`${frames.length} frames ready.`);
  } catch (error) {
    if (error.name === 'AbortError') return;
    setStatus(error.message || 'Could not read and encode that folder.');
  }
}

document.getElementById('pick-folder').addEventListener('click', pickFolder);

document.getElementById('select-all-frames').addEventListener('click', () => {
  const all = frames.length > 0 && frames.every((frame) => frame.selected);
  frames.forEach((frame) => { frame.selected = !all; });
  renderFrames();
});

document.getElementById('bulk-frame-location').addEventListener('click', () => {
  const selected = frames.map((frame, index) => frame.selected ? index : -1).filter((index) => index >= 0);
  if (!selected.length) {
    setStatus('Select at least one frame first.');
    return;
  }
  openLocationPicker(null, (value) => {
    selected.forEach((index) => {
      frames[index].location = value;
      frames[index].explicit = true;
    });
    renderFrames();
    refreshSlug();
    updateReady();
  });
});

function ensureMap() {
  if (map) return;
  map = L.map('location-map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(map);
  marker = L.marker([20, 0], { draggable: true }).addTo(map);
  marker.on('dragend', () => setCoordinates(marker.getLatLng()));
  map.on('click', (event) => {
    marker.setLatLng(event.latlng);
    setCoordinates(event.latlng);
  });
}

function setCoordinates(value) {
  document.getElementById('location-lat').value = Number(value.lat).toFixed(6);
  document.getElementById('location-lng').value = Number(value.lng).toFixed(6);
}

function fillLocationFields(value) {
  document.getElementById('location-name').value = value?.name || '';
  document.getElementById('location-lat').value = value?.lat ?? '';
  document.getElementById('location-lng').value = value?.lng ?? '';
  document.getElementById('location-region').value = value?.region?.name || '';
  pickerRegion = value?.region || null;
  if (value) {
    marker.setLatLng([value.lat, value.lng]);
    map.setView([value.lat, value.lng], 8);
  }
}

function renderLocationChips() {
  const container = document.getElementById('location-chips');
  const locations = knownLocations(rollLocation, frames);
  container.replaceChildren(...locations.map((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = displayLocation(value);
    button.addEventListener('click', () => fillLocationFields(value));
    return button;
  }));
}

function openLocationPicker(initial, apply) {
  const dialog = document.getElementById('location-dialog');
  locationApply = apply;
  ensureMap();
  renderLocationChips();
  document.getElementById('location-results').replaceChildren();
  document.getElementById('location-search').value = '';
  document.getElementById('location-message').textContent = '';
  fillLocationFields(initial);
  dialog.showModal();
  setTimeout(() => map.invalidateSize(), 0);
}

async function searchLocation() {
  const query = document.getElementById('location-search').value.trim();
  if (!query) return;
  const message = document.getElementById('location-message');
  message.textContent = 'Searching OpenStreetMap…';
  try {
    const body = await post(endpoints.geocode, { kind: 'place', query });
    const list = document.getElementById('location-results');
    list.replaceChildren(...body.results.map((result) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${result.name}${result.regionName ? ` · ${result.regionName}` : ''} (${result.lat.toFixed(2)}, ${result.lng.toFixed(2)})`;
      button.addEventListener('click', async () => {
        pickerRegion = null;
        fillLocationFields(result);
        try {
          if (result.regionName) {
            message.textContent = `Loading ${result.regionName} region…`;
            const regionBody = await post(endpoints.geocode, { kind: 'region', query: result.regionName });
            pickerRegion = regionBody.region;
            document.getElementById('location-region').value = pickerRegion?.name || result.regionName;
          }
          message.textContent = '';
          list.replaceChildren();
        } catch (error) {
          message.textContent = error.message;
        }
      });
      item.append(button);
      return item;
    }));
    message.textContent = body.results.length ? '' : 'No results.';
  } catch (error) {
    message.textContent = error.message;
  }
}

document.getElementById('search-location').addEventListener('click', searchLocation);
document.getElementById('location-search').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); searchLocation(); }
});
document.getElementById('close-location').addEventListener('click', () => document.getElementById('location-dialog').close());
document.getElementById('use-location').addEventListener('click', () => {
  const name = document.getElementById('location-name').value.trim();
  const lat = Number(document.getElementById('location-lat').value);
  const lng = Number(document.getElementById('location-lng').value);
  const regionName = document.getElementById('location-region').value.trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    document.getElementById('location-message').textContent = 'A place name and valid coordinates are required.';
    return;
  }
  if (regionName && (!pickerRegion || pickerRegion.name !== regionName)) {
    document.getElementById('location-message').textContent = 'Choose a search result or known chip so the region has coordinates.';
    return;
  }
  const value = { name, lat, lng, ...(regionName ? { region: pickerRegion } : {}) };
  locationApply?.(value);
  document.getElementById('location-dialog').close();
});

document.getElementById('set-roll-location').addEventListener('click', () => {
  openLocationPicker(rollLocation, (value) => {
    rollLocation = value;
    renderLocation();
    renderFrames();
    updateReady();
  });
});

function openImagePreview(frame) {
  const dialog = document.getElementById('image-preview');
  document.getElementById('preview-image').src = frame.previewUrl || frame.thumbUrl;
  dialog.showModal();
}
document.getElementById('close-image-preview').addEventListener('click', () => document.getElementById('image-preview').close());
document.getElementById('image-preview').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

function formErrors() {
  const roll = currentRoll();
  const errors = [];
  if (!roll.title) errors.push('title is required');
  errors.push(...rollInputErrors({
    slug: roll.slug,
    sourceSlug: source?.slug,
    stock: roll.stock,
    date: roll.date,
    location: roll.location,
    frames: roll.frames,
  }, filmStocks));
  return errors;
}

reviewButton.addEventListener('click', () => {
  pendingDelete = false;
  const errors = formErrors();
  if (errors.length) {
    setErrors(errors);
    errorsPanel.scrollIntoView({ block: 'start' });
    return;
  }
  const newFrames = frames.filter((frame) => !frame.blobSha).length;
  reviewSummary.textContent = `${mode === 'create' ? 'Create' : 'Update'} “${fields.title.value.trim()}” with ${frames.length} frames; ${newFrames} require upload; ${fields.draft.checked ? 'draft' : 'published'}.`;
  document.getElementById('publish-roll').textContent = 'upload + create pull request →';
  reviewPanel.hidden = false;
  reviewPanel.focus();
});

document.getElementById('cancel-roll-review').addEventListener('click', () => {
  pendingDelete = false;
  reviewPanel.hidden = true;
});

async function uploadNewFrames() {
  const pending = frames.filter((frame) => !frame.blobSha);
  let next = 0;
  let complete = 0;
  uploadProgress.style.width = pending.length ? '0%' : '100%';
  await Promise.all(Array.from({ length: Math.min(2, pending.length) }, async () => {
    while (next < pending.length) {
      const frame = pending[next++];
      publicationStatus.textContent = `Uploading encoded frame ${complete + 1}/${pending.length}: ${frame.sourceName}`;
      const stored = await storeBytes(frame.encoded);
      frame.blobSha = stored.sha;
      complete += 1;
      uploadProgress.style.width = `${Math.round(complete / pending.length * 100)}%`;
    }
  }));
}

function sourcePayload() {
  return source ? {
    slug: source.slug,
    markdownSha: source.markdownSha,
    frames: source.frames.map((frame) => ({ path: frame.path, sha: frame.sha })),
  } : null;
}

async function createRollPublication() {
  const button = document.getElementById('publish-roll');
  button.disabled = true;
  publicationPanel.hidden = false;
  reviewPanel.hidden = true;
  form.disabled = true;
  pendingRequestId ||= crypto.randomUUID();
  try {
    let request;
    let publishedSlug;
    if (pendingDelete) {
      request = { requestId: pendingRequestId, mode: 'delete', source: sourcePayload() };
      publishedSlug = source.slug;
    } else {
      await uploadNewFrames();
      const roll = currentRoll();
      request = {
        requestId: pendingRequestId,
        mode,
        ...(source ? { source: sourcePayload() } : {}),
        roll,
      };
      publishedSlug = roll.slug;
    }
    publicationStatus.textContent = 'Creating one atomic commit and pull request…';
    const body = await post(endpoints.publish, request);
    pendingRequestId = null;
    pollAttempts = 0;
    savePublication({
      ...body.publication,
      rollSlug: publishedSlug,
      rollMode: pendingDelete ? 'delete' : mode,
    });
    showPublication();
    await refreshPublication();
  } catch (error) {
    if (error.status === 409) pendingRequestId = null;
    publicationStatus.textContent = error.message || 'Publication failed safely. Main was not changed.';
    publicationPanel.hidden = true;
    reviewPanel.hidden = false;
    button.disabled = false;
    form.disabled = false;
  }
}

document.getElementById('publish-roll').addEventListener('click', createRollPublication);

function previewHref(value) {
  return value.rollMode === 'delete'
    ? `${value.previewUrl}/photos/`
    : `${value.previewUrl}/photos/${value.rollSlug}/`;
}

function showPublication() {
  publicationPanel.hidden = false;
  reviewPanel.hidden = true;
  form.disabled = true;
  reviewButton.disabled = true;
  publicationPr.href = publication.prUrl;
  publicationPr.textContent = `PR #${publication.number}`;
  if (publication.preview === 'ready') {
    publicationPreview.href = previewHref(publication);
    publicationPreview.textContent = publication.rollMode === 'delete' ? 'review photos index ↗' : 'review roll preview ↗';
    publicationPreview.removeAttribute('aria-disabled');
  } else {
    publicationPreview.removeAttribute('href');
    publicationPreview.textContent = 'waiting for Netlify…';
    publicationPreview.setAttribute('aria-disabled', 'true');
  }
  publicationPanel.scrollIntoView({ block: 'start' });
}

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
}

async function refreshPublication() {
  if (!publication) return;
  stopPolling();
  publicationStatus.textContent = 'Checking GitHub and Netlify…';
  try {
    const body = await api(`${endpoints.status}?number=${encodeURIComponent(publication.number)}`);
    savePublication({ ...publication, ...body.publication });
    showPublication();
    if (publication.state === 'merged') {
      publicationStatus.textContent = 'Merged. Production will rebuild from main.';
      mergeButton.disabled = true;
      return;
    }
    if (publication.state !== 'open') {
      publicationStatus.textContent = 'Publication is closed.';
      mergeButton.disabled = true;
      return;
    }
    if (publication.preview === 'ready' && publication.mergeable === true) {
      publicationStatus.textContent = 'Deploy Preview is ready. Review it before merging.';
      mergeButton.disabled = false;
      return;
    }
    if (publication.preview === 'ready' && publication.mergeable === false) {
      publicationStatus.textContent = 'The preview is ready, but this PR conflicts with main. Abandon and reload.';
      mergeButton.disabled = true;
      return;
    }
    mergeButton.disabled = true;
    pollAttempts += 1;
    publicationStatus.textContent = publication.preview === 'ready'
      ? 'Preview ready; waiting for GitHub mergeability…'
      : 'Waiting for the public Deploy Preview…';
    if (pollAttempts < 30) pollTimer = setTimeout(refreshPublication, publication.preview === 'ready' ? 3_000 : 10_000);
    else publicationStatus.textContent = 'Preview is still unavailable. Open the PR to inspect the Netlify check, then refresh.';
  } catch (error) {
    publicationStatus.textContent = error.message;
  }
}

document.getElementById('refresh-roll-publication').addEventListener('click', () => {
  pollAttempts = 0;
  refreshPublication();
});

document.getElementById('merge-roll-publication').addEventListener('click', async () => {
  if (!publication || !confirm(`Merge PR #${publication.number} after reviewing its Deploy Preview?`)) return;
  mergeButton.disabled = true;
  publicationStatus.textContent = 'Merging reviewed roll publication…';
  try {
    await post(endpoints.merge, { number: publication.number, headSha: publication.headSha });
    savePublication(null);
    location.href = '/rolls/';
  } catch (error) {
    publicationStatus.textContent = error.message;
    mergeButton.disabled = false;
  }
});

document.getElementById('abandon-roll-publication').addEventListener('click', async () => {
  if (!publication || !confirm(`Close PR #${publication.number} and delete its publishing branch?`)) return;
  publicationStatus.textContent = 'Abandoning publication…';
  try {
    await post(endpoints.abandon, { number: publication.number, headSha: publication.headSha });
    stopPolling();
    savePublication(null);
    publicationPanel.hidden = true;
    form.disabled = false;
    updateReady();
    setStatus('Publication abandoned. Local edits remain in this tab.');
  } catch (error) {
    publicationStatus.textContent = error.message;
  }
});

if (mode === 'edit') {
  document.getElementById('delete-roll').addEventListener('click', () => {
    const typed = prompt(`Type the complete slug to delete this roll:\n\n${source.slug}`);
    if (typed !== source.slug) {
      setStatus('Delete cancelled; slug did not match exactly.');
      return;
    }
    pendingDelete = true;
    reviewSummary.textContent = `Delete “${source.slug}” and all ${source.frames.length} committed frames. Production changes only after preview review and merge.`;
    document.getElementById('publish-roll').textContent = 'create deletion pull request →';
    reviewPanel.hidden = false;
    reviewPanel.focus();
  });
}

function bindMetadata() {
  [fields.title, fields.stock, fields.date, fields.draft, fields.body].forEach((element) => {
    element.addEventListener('input', () => {
      if (element === fields.stock || element === fields.date) refreshSlug();
      updateReady();
    });
  });
  fields.slug.addEventListener('input', () => {
    slugManual = true;
    updateReady();
  });
  fields.slug.addEventListener('change', () => { fields.slug.value = slugify(fields.slug.value); updateReady(); });
}

async function loadExisting() {
  setStatus('Loading committed Markdown and frame inventory…');
  const body = await api(`${endpoints.roll}?slug=${encodeURIComponent(routeSlug)}`);
  const roll = body.roll;
  source = { slug: roll.slug, markdownSha: roll.markdownSha, frames: roll.sourceFrames };
  document.getElementById('delete-roll').disabled = false;
  fields.title.value = roll.title;
  fields.stock.value = roll.stock;
  fields.date.value = roll.date;
  fields.slug.value = roll.slug;
  fields.draft.checked = roll.draft;
  fields.body.value = roll.body;
  rollLocation = roll.location;
  frames = roll.frames.map((frame) => ({
    localId: frame.blobSha,
    blobSha: frame.blobSha,
    encoded: null,
    thumbUrl: frame.imageUrl,
    previewUrl: frame.imageUrl,
    alt: frame.alt || '',
    caption: frame.caption || '',
    location: frame.location || null,
    explicit: Boolean(frame.location),
    selected: false,
  }));
  renderLocation();
  renderFrames();
  originalFingerprint = fingerprint();
  form.disabled = Boolean(publication);
  updateReady();
  setStatus('Committed roll loaded.');
}

async function start() {
  const capabilities = uploaderCapabilities();
  if (!capabilities.supported) {
    document.getElementById('uploader-unsupported').hidden = false;
    document.getElementById('missing-capabilities').textContent = capabilities.missing.join(', ');
    return;
  }
  document.getElementById('uploader-supported').hidden = false;
  fields.stock.replaceChildren(...Object.entries(filmStocks)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([slug, stock]) => {
      const option = document.createElement('option');
      option.value = slug;
      option.textContent = stock.name;
      return option;
    }));
  fields.date.value = new Date().toISOString().slice(0, 10);
  bindMetadata();
  if (mode === 'edit') await loadExisting();
  else {
    form.disabled = Boolean(publication);
    setStatus('Choose a scan folder to begin.');
    refreshSlug();
  }
  if (publication) {
    showPublication();
    await refreshPublication();
  }
}

window.addEventListener('pagehide', () => frames.forEach(releaseFrameUrls));
start().catch((error) => setStatus(error.message || 'Could not start the roll editor.'));
