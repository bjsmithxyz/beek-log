import { escapeHtml } from '@beek/shared/escape-html';
import { validateTrip } from '@beek/shared/trip-validation';
import {
  addStop,
  cloneTrip,
  moveStop,
  removeStop,
  tripSummary,
  tripsEqual,
} from '../lib/travel-editor-state.mjs';

const endpoints = {
  data: '/.netlify/functions/travel-data',
  start: '/.netlify/functions/publish-start',
  status: '/.netlify/functions/publish-status',
  merge: '/.netlify/functions/publish-merge',
  abandon: '/.netlify/functions/publish-abandon',
  geocode: '/.netlify/functions/geocode',
};
const publicationKey = 'beek-admin-travel-publication';

const editor = document.getElementById('travel-editor');
const statusNode = document.getElementById('editor-status');
const errorsPanel = document.getElementById('editor-errors');
const errorsList = document.getElementById('editor-error-list');
const stopList = document.getElementById('stop-list');
const stopCount = document.getElementById('stop-count');
const reviewButton = document.getElementById('review-travel');
const reviewPanel = document.getElementById('review-panel');
const reviewSummary = document.getElementById('review-summary');
const publicationPanel = document.getElementById('publication-panel');
const publicationStatus = document.getElementById('publication-status');
const publicationPr = document.getElementById('publication-pr');
const publicationPreview = document.getElementById('publication-preview');
const mergeButton = document.getElementById('merge-publication');

let original = null;
let draft = null;
let expectedSha = null;
let publication = restorePublication();
let pendingRequestId = null;
let pollTimer = null;
let pollAttempts = 0;

function restorePublication() {
  try {
    const value = JSON.parse(sessionStorage.getItem(publicationKey) || 'null');
    if (Number.isSafeInteger(value?.number) && /^[0-9a-f]{40}$/.test(value?.headSha || '')) return value;
  } catch {
    // A malformed local status hint is not trusted and can be discarded.
  }
  sessionStorage.removeItem(publicationKey);
  return null;
}

function savePublication(value) {
  publication = value;
  if (value) sessionStorage.setItem(publicationKey, JSON.stringify(value));
  else sessionStorage.removeItem(publicationKey);
}

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.code = body.code;
    error.status = response.status;
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
  // Any explicit status message clears the "unpublished" styling; only
  // updateDirtyState re-applies it, so loading/error text never pulses green.
  statusNode.classList.remove('is-dirty');
}

function setErrors(errors) {
  errorsList.replaceChildren(...errors.map((message) => {
    const item = document.createElement('li');
    item.textContent = message;
    return item;
  }));
  errorsPanel.hidden = errors.length === 0;
}

function formatCoord(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : '—';
}

function renderStops() {
  clearGeocodeTimers();
  stopCount.textContent = `(${draft.stops.length})`;
  stopList.innerHTML = draft.stops.map((stop, index) => `
    <article class="stop-card" data-index="${index}">
      <header class="stop-card-head">
        <div class="stop-card-id">
          <button type="button" class="stop-collapse" data-action="collapse" aria-expanded="true" aria-label="Collapse stop ${index + 1}">▾</button>
          <span class="stop-number">${String(index + 1).padStart(3, '0')}</span>
          <span class="stop-name-preview">${escapeHtml(stop.name || 'unnamed stop')}</span>
        </div>
        <div class="stop-head-controls">
          <div class="stop-actions" aria-label="Reorder stop ${index + 1}">
            <button type="button" data-action="up" aria-label="Move stop ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" data-action="down" aria-label="Move stop ${index + 1} down" ${index === draft.stops.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" data-action="add-after" aria-label="Add a stop after stop ${index + 1}">+</button>
            <button class="remove-stop" type="button" data-action="remove" aria-label="Delete stop ${index + 1}" ${draft.stops.length === 1 ? 'disabled' : ''}>×</button>
          </div>
          <label class="tentative-field"><input data-field="tentative" type="checkbox" ${stop.tentative ? 'checked' : ''}><span>tentative</span></label>
        </div>
      </header>
      <div class="stop-grid">
        <div class="stop-fields">
          <input class="field-place" data-field="name" aria-label="place" placeholder="place" maxlength="120" required value="${escapeHtml(stop.name)}">
          <input class="field-country" data-field="country" aria-label="country" placeholder="country" maxlength="120" required value="${escapeHtml(stop.country)}">
          <div class="dates">
            <label><span>arrive</span><input data-field="arrive" type="date" required value="${escapeHtml(stop.arrive)}"></label>
            <label><span>depart</span><input data-field="depart" type="date" required value="${escapeHtml(stop.depart)}"></label>
          </div>
          <textarea class="field-note" data-field="note" aria-label="note" placeholder="note" maxlength="500">${escapeHtml(stop.note || '')}</textarea>
        </div>
        <div class="derived-field" role="group" aria-label="Resolved location for stop ${index + 1}">
          <div class="derived-item"><span class="derived-key">code</span><span class="derived-value" data-derived="cc">${escapeHtml(stop.cc || '—')}</span></div>
          <div class="derived-item"><span class="derived-key">lat</span><span class="derived-value" data-derived="lat">${formatCoord(stop.lat)}</span></div>
          <div class="derived-item"><span class="derived-key">lon</span><span class="derived-value" data-derived="lon">${formatCoord(stop.lon)}</span></div>
          <button type="button" class="refresh-geo" data-action="geocode" aria-label="Refresh location data for stop ${index + 1}" title="Refresh code, latitude and longitude from place + country">🌐</button>
        </div>
      </div>
    </article>
  `).join('');
}

// The code / latitude / longitude are derived, not typed: place + country are
// geocoded (debounced while typing, or on the globe button) and the resolved
// values are written back into the draft and shown read-only on the card.
const geocodeTimers = new Map();

function clearGeocodeTimers() {
  for (const timer of geocodeTimers.values()) clearTimeout(timer);
  geocodeTimers.clear();
}

function scheduleGeocode(index) {
  clearTimeout(geocodeTimers.get(index));
  geocodeTimers.set(index, setTimeout(() => {
    geocodeTimers.delete(index);
    geocodeStop(index);
  }, 800));
}

function updateDerived(index) {
  const card = stopList.querySelector(`[data-index="${index}"]`);
  if (!card) return;
  const stop = draft.stops[index];
  card.querySelector('[data-derived="cc"]').textContent = stop.cc || '—';
  card.querySelector('[data-derived="lat"]').textContent = formatCoord(stop.lat);
  card.querySelector('[data-derived="lon"]').textContent = formatCoord(stop.lon);
}

async function geocodeStop(index) {
  const stop = draft?.stops[index];
  if (!stop) return;
  const query = [stop.name, stop.country].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
  if (!query) return;
  const button = stopList.querySelector(`[data-index="${index}"] [data-action="geocode"]`);
  button?.setAttribute('aria-busy', 'true');
  try {
    const body = await post(endpoints.geocode, { kind: 'place', query });
    const result = body.results?.[0];
    if (!result) {
      setStatus(`No location match for “${query}”.`);
      return;
    }
    stop.lat = Number(result.lat);
    stop.lon = Number(result.lng);
    if (result.cc) stop.cc = result.cc;
    updateDerived(index);
    updateDirtyState();
    refreshOverview();
  } catch (error) {
    setStatus(error.message || 'Could not resolve this location.');
  } finally {
    button?.removeAttribute('aria-busy');
  }
}

function updateDirtyState() {
  const dirty = original && !tripsEqual(original, draft);
  reviewButton.disabled = !dirty || Boolean(publication);
  setStatus(dirty ? 'Unpublished changes.' : '');
  statusNode.classList.toggle('is-dirty', Boolean(dirty));
  reviewPanel.hidden = true;
  setErrors([]);
}

function renderEditor() {
  renderStops();
  drawOverview();
  editor.disabled = Boolean(publication);
  updateDirtyState();
}

async function loadData({ force = false } = {}) {
  if (!force && original && !tripsEqual(original, draft) && !confirm('Discard unpublished travel edits and reload main?')) return;
  stopPolling();
  editor.disabled = true;
  reviewButton.disabled = true;
  setErrors([]);
  setStatus('Loading the itinerary from GitHub…');
  try {
    const body = await api(endpoints.data);
    original = cloneTrip(body.trips);
    draft = cloneTrip(body.trips);
    expectedSha = body.sha;
    renderEditor();
    if (publication) {
      editor.disabled = true;
      showPublication();
      await refreshPublication();
    }
  } catch (error) {
    setStatus(error.message || 'Could not load the itinerary.');
  }
}

function stopIndex(target) {
  return Number(target.closest('.stop-card')?.dataset.index);
}

// Loaded on demand: it pulls in Leaflet, which the editing UI itself never
// needs, and it is absent entirely from the minimal DOM the unit test builds.
let overviewModule = null;
async function drawOverview() {
  if (!draft || !document.getElementById('travel-overview-map')) return;
  overviewModule ??= await import('./travel-overview.js');
  overviewModule.renderOverview(draft);
}

// Rebuilding the map on every keystroke would be wasteful, and a half-typed
// date or coordinate is not worth drawing. Settle first.
let overviewTimer = null;
function refreshOverview() {
  clearTimeout(overviewTimer);
  overviewTimer = setTimeout(drawOverview, 400);
}

stopList.addEventListener('input', (event) => {
  const input = event.target.closest('[data-field]');
  if (!input || !draft) return;
  const index = stopIndex(input);
  const field = input.dataset.field;
  if (!Number.isInteger(index) || !field) return;
  let value = input.value;
  if (input.type === 'number') value = input.value === '' ? Number.NaN : Number(input.value);
  if (input.type === 'checkbox') value = input.checked;
  draft.stops[index][field] = value;
  const preview = input.closest('.stop-card')?.querySelector('.stop-name-preview');
  if (field === 'name' && preview) preview.textContent = value || 'unnamed stop';
  if (field === 'name' || field === 'country') scheduleGeocode(index);
  updateDirtyState();
  refreshOverview();
});

stopList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !draft) return;
  const index = stopIndex(button);
  const action = button.dataset.action;
  if (action === 'collapse') {
    const card = button.closest('.stop-card');
    const nowCollapsed = card.toggleAttribute('data-collapsed');
    button.setAttribute('aria-expanded', String(!nowCollapsed));
    return;
  }
  if (action === 'geocode') {
    clearTimeout(geocodeTimers.get(index));
    geocodeTimers.delete(index);
    geocodeStop(index);
    return;
  }
  let focusIndex = index;
  if (action === 'up' && moveStop(draft, index, -1)) focusIndex = index - 1;
  if (action === 'down' && moveStop(draft, index, 1)) focusIndex = index + 1;
  if (action === 'add-after') focusIndex = addStop(draft, index);
  if (action === 'remove') {
    if (!confirm(`Delete stop ${index + 1}: ${draft.stops[index].name || 'unnamed'}?`)) return;
    if (removeStop(draft, index)) focusIndex = Math.min(index, draft.stops.length - 1);
  }
  renderStops();
  updateDirtyState();
  refreshOverview();
  stopList.querySelector(`[data-index="${focusIndex}"] input[data-field="name"]`)?.focus();
});

document.getElementById('add-stop').addEventListener('click', () => {
  const index = addStop(draft);
  renderStops();
  updateDirtyState();
  refreshOverview();
  stopList.querySelector(`[data-index="${index}"] input[data-field="name"]`)?.focus();
});

document.getElementById('reload-travel').addEventListener('click', () => loadData());

// The full-itinerary panel (map + table) can be minimised. Re-rendering the
// overview on expand lets Leaflet recompute its size after being unhidden.
const overviewPanel = document.querySelector('.overview-panel');
document.getElementById('overview-collapse')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const nowCollapsed = overviewPanel.toggleAttribute('data-collapsed');
  button.setAttribute('aria-expanded', String(!nowCollapsed));
  if (!nowCollapsed) refreshOverview();
});

reviewButton.addEventListener('click', () => {
  const errors = validateTrip(draft);
  if (errors.length) {
    setErrors(errors);
    errorsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (tripsEqual(original, draft)) {
    setStatus('There are no changes to publish.');
    return;
  }
  const summary = tripSummary(draft);
  reviewSummary.textContent = `${summary.stops} stops from ${summary.firstDate} to ${summary.lastDate}; ${summary.tentative} tentative.`;
  reviewPanel.hidden = false;
  reviewPanel.focus();
});

document.getElementById('cancel-review').addEventListener('click', () => {
  reviewPanel.hidden = true;
  reviewButton.focus();
});

function showPublication() {
  publicationPanel.hidden = false;
  reviewPanel.hidden = true;
  editor.disabled = true;
  reviewButton.disabled = true;
  publicationPr.href = publication.prUrl;
  publicationPr.textContent = `PR #${publication.number}`;
  if (publication.preview === 'ready') {
    publicationPreview.href = publication.previewUrl;
    publicationPreview.removeAttribute('aria-disabled');
  } else {
    publicationPreview.removeAttribute('href');
    publicationPreview.setAttribute('aria-disabled', 'true');
  }
  mergeButton.disabled = true;
  publicationPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      publicationStatus.textContent = 'This publication is closed. Reload to continue editing.';
      mergeButton.disabled = true;
      return;
    }
    if (publication.preview === 'ready') {
      publicationPreview.href = publication.previewUrl;
      publicationPreview.removeAttribute('aria-disabled');
      publicationPreview.textContent = 'open public preview ↗';
      if (publication.mergeable === true) {
        publicationStatus.textContent = 'Deploy Preview is ready. Review it before merging.';
        mergeButton.disabled = false;
      } else if (publication.mergeable === false) {
        publicationStatus.textContent = 'Deploy Preview is ready, but the pull request conflicts with main. Abandon it, reload, and publish again.';
        mergeButton.disabled = true;
      } else {
        publicationStatus.textContent = 'Deploy Preview is ready; waiting for GitHub to finish its mergeability check…';
        mergeButton.disabled = true;
        pollAttempts += 1;
        if (pollAttempts < 30) pollTimer = setTimeout(refreshPublication, 3_000);
      }
    } else {
      publicationStatus.textContent = 'Pull request created; waiting for the public Deploy Preview…';
      publicationPreview.textContent = 'waiting for Netlify…';
      mergeButton.disabled = true;
      pollAttempts += 1;
      if (pollAttempts < 30) {
        pollTimer = setTimeout(refreshPublication, 10_000);
      } else {
        publicationStatus.textContent = 'Preview is still unavailable. Check the pull request for a failed Netlify build, then refresh status.';
      }
    }
  } catch (error) {
    publicationStatus.textContent = error.message || 'Could not refresh publication status.';
  }
}

document.getElementById('publish-travel').addEventListener('click', async () => {
  const button = document.getElementById('publish-travel');
  button.disabled = true;
  pendingRequestId ||= crypto.randomUUID();
  setStatus('Creating branch, commit and pull request…');
  try {
    const body = await post(endpoints.start, {
      requestId: pendingRequestId,
      expectedSha,
      trips: draft,
    });
    pendingRequestId = null;
    pollAttempts = 0;
    savePublication(body.publication);
    showPublication();
    await refreshPublication();
  } catch (error) {
    if (error.status === 409) pendingRequestId = null;
    setStatus(error.message || 'Publication failed safely. Main was not changed.');
    button.disabled = false;
  }
});

document.getElementById('refresh-publication').addEventListener('click', () => {
  pollAttempts = 0;
  refreshPublication();
});

mergeButton.addEventListener('click', async () => {
  if (!publication || !confirm(`Merge PR #${publication.number} to main after reviewing its Deploy Preview?`)) return;
  mergeButton.disabled = true;
  publicationStatus.textContent = 'Merging the reviewed pull request…';
  try {
    await post(endpoints.merge, { number: publication.number, headSha: publication.headSha });
    publicationStatus.textContent = 'Merged. Reloading the new main itinerary…';
    savePublication(null);
    await new Promise((resolve) => setTimeout(resolve, 750));
    publicationPanel.hidden = true;
    await loadData({ force: true });
  } catch (error) {
    publicationStatus.textContent = error.message || 'Merge failed; the pull request remains open.';
    mergeButton.disabled = false;
  }
});

document.getElementById('abandon-publication').addEventListener('click', async () => {
  if (!publication || !confirm(`Close PR #${publication.number} and delete its publishing branch?`)) return;
  publicationStatus.textContent = 'Abandoning publication…';
  try {
    await post(endpoints.abandon, { number: publication.number, headSha: publication.headSha });
    stopPolling();
    savePublication(null);
    publicationPanel.hidden = true;
    editor.disabled = false;
    updateDirtyState();
    setStatus('Publication abandoned. Your local edits are still here.');
  } catch (error) {
    publicationStatus.textContent = error.message || 'Could not abandon publication.';
  }
});

loadData();
