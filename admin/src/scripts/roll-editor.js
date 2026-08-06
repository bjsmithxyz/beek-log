import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { escapeHtml } from '@beek/shared/escape-html';
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
const endpoints = {
  roll: '/.netlify/functions/roll-data',
  publish: '/.netlify/functions/publish-roll',
  geocode: '/.netlify/functions/geocode',
};

let frames = [];
let source = null;
let rollLocation = null;
let originalFingerprint = null;
let slugManual = mode === 'edit';
let pendingDelete = false;
let pendingRequestId = null;
let publishing = false;
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
const publicationError = document.getElementById('roll-publication-error');
const errorsPanel = document.getElementById('roll-errors');
const errorsList = document.getElementById('roll-error-list');
const publicationStatus = document.getElementById('roll-publication-status');
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
  if (publishing) {
    reviewButton.disabled = true;
  } else if (!frames.length) {
    reviewButton.disabled = true;
  } else if (mode === 'edit' && originalFingerprint === fingerprint()) {
    reviewButton.disabled = true;
  } else {
    reviewButton.disabled = false;
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

function filesFromDirectoryInput() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/jpeg,image/png,image/webp';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.hidden = true;
    document.body.append(input);
    let settled = false;
    const finish = (cancelled = false) => {
      if (settled) return;
      settled = true;
      const selected = [...input.files];
      const relativePath = selected[0]?.webkitRelativePath || '';
      input.remove();
      resolve(cancelled ? null : {
        name: relativePath.split('/')[0] || 'scans',
        files: selected
          .filter((file) => /\.(jpe?g|png|webp)$/i.test(file.name))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
      });
    };
    input.addEventListener('change', () => finish(false), { once: true });
    input.addEventListener('cancel', () => finish(true), { once: true });
    input.click();
  });
}

async function pickFolder() {
  try {
    let folder;
    if (typeof window.showDirectoryPicker === 'function') {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      folder = { name: handle.name, files: await filesFromDirectory(handle) };
    } else {
      folder = await filesFromDirectoryInput();
    }
    if (!folder) return;
    const { files } = folder;
    if (!files.length) throw new Error('No browser-decodable JPEG, PNG, or WebP images found.');
    const parsed = parseFolderName(folder.name, filmStocks);
    if (parsed.date) fields.date.value = parsed.date;
    if (parsed.stockSlug) fields.stock.value = parsed.stockSlug;
    // The field is labelled by what it means, so show the resolved country and
    // keep the bare ISO 3166 code only when it resolves to nothing.
    fields.iso.value = parsed.country || parsed.iso || '';
    // Reflect the folder in the slug now rather than after the encode: what was
    // detected should be visible while the scans are still being processed.
    refreshSlug();
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
  publicationError.hidden = true;
  publicationError.textContent = '';
  publicationStatus.textContent = '';
  document.getElementById('publish-roll').textContent = 'upload + publish to main →';
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
  const results = await Promise.allSettled(Array.from({ length: Math.min(2, pending.length) }, async () => {
    while (next < pending.length) {
      const frame = pending[next++];
      publicationStatus.textContent = `Uploading encoded frame ${complete + 1}/${pending.length}: ${frame.sourceName}`;
      try {
        const stored = await storeBytes(frame.encoded);
        frame.blobSha = stored.sha;
      } catch (error) {
        const size = `${(frame.encoded.byteLength / 1024 / 1024).toFixed(2)} MiB`;
        throw new Error(`${frame.sourceName} (${size}): ${error.message || 'image upload failed'}`);
      }
      complete += 1;
      uploadProgress.style.width = `${Math.round(complete / pending.length * 100)}%`;
    }
  }));
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
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
  publishing = true;
  publicationError.hidden = true;
  publicationError.textContent = '';
  form.disabled = true;
  reviewButton.disabled = true;
  pendingRequestId ||= crypto.randomUUID();
  try {
    let request;
    if (pendingDelete) {
      request = { requestId: pendingRequestId, mode: 'delete', source: sourcePayload() };
    } else {
      await uploadNewFrames();
      const roll = currentRoll();
      request = {
        requestId: pendingRequestId,
        mode,
        ...(source ? { source: sourcePayload() } : {}),
        roll,
      };
    }
    publicationStatus.textContent = 'Committing roll to main…';
    const body = await post(endpoints.publish, request);
    pendingRequestId = null;
    const sha = body.publication?.commitSha?.slice(0, 7) || 'main';
    publicationStatus.textContent = `Published ${sha}. Production will rebuild from main.`;
    setStatus(`Published ${sha}. Redirecting…`);
    await new Promise((resolve) => setTimeout(resolve, 750));
    location.href = '/rolls/';
  } catch (error) {
    if (error.status === 409) pendingRequestId = null;
    publishing = false;
    const message = error.message || 'Publication failed safely. Main was not changed.';
    publicationStatus.textContent = message;
    publicationError.textContent = `Publication failed safely: ${message}. Main was not changed; retry uploads only unfinished frames.`;
    publicationError.hidden = false;
    setStatus(`Publication failed safely: ${message}`);
    reviewPanel.hidden = false;
    reviewPanel.focus();
    reviewPanel.scrollIntoView({ block: 'start' });
    button.disabled = false;
    form.disabled = false;
    updateReady();
  }
}

document.getElementById('publish-roll').addEventListener('click', createRollPublication);

if (mode === 'edit') {
  document.getElementById('delete-roll').addEventListener('click', () => {
    const typed = prompt(`Type the complete slug to delete this roll:\n\n${source.slug}`);
    if (typed !== source.slug) {
      setStatus('Delete cancelled; slug did not match exactly.');
      return;
    }
    pendingDelete = true;
    reviewSummary.textContent = `Delete “${source.slug}” and all ${source.frames.length} committed frames. This commits the deletion to main.`;
    publicationStatus.textContent = '';
    document.getElementById('publish-roll').textContent = 'delete on main →';
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
  form.disabled = false;
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
    form.disabled = false;
    setStatus('');
    refreshSlug();
  }
}

window.addEventListener('pagehide', () => frames.forEach(releaseFrameUrls));
start().catch((error) => setStatus(error.message || 'Could not start the roll editor.'));
