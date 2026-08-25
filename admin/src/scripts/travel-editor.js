import { escapeHtml } from '@beek/shared/escape-html';
import { validateTrip } from '@beek/shared/trip-validation';
import {
  addStop,
  cloneTrip,
  moveStop,
  pushTentativeFutureDates,
  removeStop,
  tripSummary,
  tripsEqual,
} from '../lib/travel-editor-state.mjs';

const endpoints = {
  data: '/.netlify/functions/travel-data',
  start: '/.netlify/functions/publish-start',
  geocode: '/.netlify/functions/geocode',
};

const editor = document.getElementById('travel-editor');
const statusNode = document.getElementById('editor-status');
const errorsPanel = document.getElementById('editor-errors');
const errorsList = document.getElementById('editor-error-list');
const stopList = document.getElementById('stop-list');
const stopCount = document.getElementById('stop-count');
const reviewButton = document.getElementById('review-travel');
const reviewPanel = document.getElementById('review-panel');
const reviewSummary = document.getElementById('review-summary');

let original = null;
let draft = null;
let expectedSha = null;
let pendingRequestId = null;
let publishing = false;

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

// Time bucket for the past/future filters. Anything neither finished nor
// clearly upcoming (including a new stop with no dates yet) counts as current
// and always shows.
function stopWhen(stop) {
  const today = new Date().toISOString().slice(0, 10);
  if (stop.depart && stop.depart < today) return 'past';
  if (stop.arrive && stop.arrive > today) return 'future';
  return 'current';
}

function renderStops() {
  clearGeocodeTimers();
  stopCount.textContent = `(${draft.stops.length})`;
  stopList.innerHTML = draft.stops.map((stop, index) => `
    <article class="stop-card" data-index="${index}" data-when="${stopWhen(stop)}">
      <header class="stop-card-head">
        <div class="stop-card-id">
          <div class="stop-id-line">
            <span class="stop-number">${String(index + 1).padStart(3, '0')}</span>
            <span class="stop-name-preview">${escapeHtml(stop.name || 'unnamed stop')}</span>
          </div>
          <label class="tentative-field"><input data-field="tentative" type="checkbox" ${stop.tentative ? 'checked' : ''}><span>tentative</span></label>
        </div>
        <div class="stop-actions" aria-label="Stop ${index + 1} actions">
          <button type="button" data-action="up" aria-label="Move stop ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-action="down" aria-label="Move stop ${index + 1} down" ${index === draft.stops.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-action="add-after" aria-label="Add a stop after stop ${index + 1}">+</button>
          <button class="remove-stop" type="button" data-action="remove" aria-label="Delete stop ${index + 1}" ${draft.stops.length === 1 ? 'disabled' : ''}>×</button>
          <button type="button" class="refresh-geo" data-action="geocode" aria-label="Refresh location data for stop ${index + 1}" title="Refresh code, latitude and longitude from place + country">🌐</button>
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

function syncDateInputs() {
  draft.stops.forEach((stop, index) => {
    const card = stopList.querySelector(`[data-index="${index}"]`);
    card?.querySelector('[data-field="arrive"]')?.setAttribute('value', stop.arrive || '');
    card?.querySelector('[data-field="depart"]')?.setAttribute('value', stop.depart || '');
    // Date inputs use their live value property, not only the HTML attribute.
    const arrive = card?.querySelector('[data-field="arrive"]');
    const depart = card?.querySelector('[data-field="depart"]');
    if (arrive) arrive.value = stop.arrive || '';
    if (depart) depart.value = stop.depart || '';
  });
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

function updateDirtyState(message = null) {
  const dirty = original && !tripsEqual(original, draft);
  reviewButton.disabled = !dirty || publishing;
  setStatus(dirty ? (message || 'Unpublished changes.') : '');
  statusNode.classList.toggle('is-dirty', Boolean(dirty));
  reviewPanel.hidden = true;
  setErrors([]);
}

function renderEditor() {
  renderStops();
  drawOverview();
  editor.disabled = publishing;
  updateDirtyState();
}

async function loadData({ force = false } = {}) {
  if (!force && original && !tripsEqual(original, draft) && !confirm('Discard unpublished travel edits and reload main?')) return;
  editor.disabled = true;
  reviewButton.disabled = true;
  setErrors([]);
  setStatus('Loading the itinerary from GitHub…');
  try {
    const body = await api(endpoints.data);
    original = cloneTrip(body.trips);
    draft = cloneTrip(body.trips);
    expectedSha = body.sha;
    publishing = false;
    renderEditor();
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
  const previousValue = draft.stops[index][field];
  draft.stops[index][field] = value;
  let moved = 0;
  if (field === 'depart' && value > previousValue) {
    moved = pushTentativeFutureDates(draft, index, previousValue, value);
    if (moved) syncDateInputs();
  }
  const preview = input.closest('.stop-card')?.querySelector('.stop-name-preview');
  if (field === 'name' && preview) preview.textContent = value || 'unnamed stop';
  if (field === 'name' || field === 'country') scheduleGeocode(index);
  updateDirtyState(moved ? `Unpublished changes; moved ${moved} tentative future stop${moved === 1 ? '' : 's'} forward.` : null);
  refreshOverview();
});

stopList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !draft) return;
  const index = stopIndex(button);
  const action = button.dataset.action;
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

// Stop-list view controls: hide a time bucket, or collapse the whole list so
// the full-itinerary section below is a short scroll away.
function bindFilter(id, hiddenClass) {
  const button = document.getElementById(id);
  button?.addEventListener('click', () => {
    const showing = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(showing));
    stopList.classList.toggle(hiddenClass, !showing);
  });
}
bindFilter('filter-past', 'hide-past');
bindFilter('filter-future', 'hide-future');

document.getElementById('collapse-stops')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const collapsed = stopList.classList.toggle('is-collapsed');
  button.setAttribute('aria-pressed', String(collapsed));
  button.textContent = collapsed ? 'expand all' : 'collapse all';
});

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

document.getElementById('publish-travel').addEventListener('click', async () => {
  const button = document.getElementById('publish-travel');
  button.disabled = true;
  publishing = true;
  editor.disabled = true;
  reviewButton.disabled = true;
  pendingRequestId ||= crypto.randomUUID();
  setStatus('Committing itinerary to main…');
  try {
    const body = await post(endpoints.start, {
      requestId: pendingRequestId,
      expectedSha,
      trips: draft,
    });
    pendingRequestId = null;
    const sha = body.publication?.commitSha?.slice(0, 7) || 'main';
    setStatus(`Published ${sha}. Production will rebuild from main.`);
    reviewPanel.hidden = true;
    await new Promise((resolve) => setTimeout(resolve, 750));
    await loadData({ force: true });
  } catch (error) {
    if (error.status === 409) pendingRequestId = null;
    publishing = false;
    editor.disabled = false;
    setStatus(error.message || 'Publication failed safely. Main was not changed.');
    button.disabled = false;
    updateDirtyState();
  }
});

loadData();
