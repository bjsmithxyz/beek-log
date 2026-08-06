import { deriveSlug, slugify } from '@beek/shared/slug';

export const root = document.getElementById('roll-editor-root');
export const mode = root.dataset.mode;
export const routeSlug = root.dataset.slug;
export const endpoints = {
  roll: '/.netlify/functions/roll-data',
  publish: '/.netlify/functions/publish-roll',
  geocode: '/.netlify/functions/geocode',
};

export const state = {
  frames: [],
  source: null,
  rollLocation: null,
  originalFingerprint: null,
  slugManual: mode === 'edit',
  pendingDelete: false,
  pendingRequestId: null,
  publishing: false,
  pickerRegion: null,
  locationApply: null,
  map: null,
  marker: null,
};

export const form = document.getElementById('roll-form');
export const statusNode = document.getElementById('roll-status');
export const frameGrid = document.getElementById('frame-grid');
export const frameCount = document.getElementById('frame-count');
export const reviewButton = document.getElementById('review-roll');
export const reviewPanel = document.getElementById('roll-review');
export const reviewSummary = document.getElementById('roll-review-summary');
export const publicationError = document.getElementById('roll-publication-error');
export const errorsPanel = document.getElementById('roll-errors');
export const errorsList = document.getElementById('roll-error-list');
export const publicationStatus = document.getElementById('roll-publication-status');
export const uploadProgress = document.getElementById('upload-progress');

export const fields = {
  title: document.getElementById('roll-title'),
  stock: document.getElementById('roll-stock'),
  date: document.getElementById('roll-date'),
  iso: document.getElementById('roll-iso'),
  slug: document.getElementById('roll-slug'),
  draft: document.getElementById('roll-draft'),
  body: document.getElementById('roll-body'),
};

export async function api(url, options = {}) {
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

export function post(url, body) {
  return api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function setStatus(message) {
  statusNode.textContent = message;
}

export function setErrors(errors) {
  errorsList.replaceChildren(...errors.map((message) => {
    const item = document.createElement('li');
    item.textContent = message;
    return item;
  }));
  errorsPanel.hidden = errors.length === 0;
}

export function displayLocation(value) {
  return value ? `${value.name}${value.region ? ` · ${value.region.name}` : ''}` : '(none set)';
}

export function currentRoll() {
  return {
    slug: slugify(fields.slug.value),
    title: fields.title.value.trim(),
    stock: fields.stock.value,
    date: fields.date.value,
    location: state.rollLocation,
    draft: fields.draft.checked,
    body: fields.body.value,
    frames: state.frames.map((frame) => ({
      blobSha: frame.blobSha,
      alt: frame.alt || '',
      ...(frame.caption ? { caption: frame.caption } : {}),
      ...(frame.location ? { location: frame.location } : {}),
    })),
  };
}

export function fingerprint() {
  const roll = currentRoll();
  roll.frames = state.frames.map((frame) => ({
    identity: frame.blobSha || frame.localId,
    alt: frame.alt || '',
    caption: frame.caption || '',
    location: frame.location || null,
  }));
  return JSON.stringify(roll);
}

export function updateReady() {
  if (state.publishing) {
    reviewButton.disabled = true;
  } else if (!state.frames.length) {
    reviewButton.disabled = true;
  } else if (mode === 'edit' && state.originalFingerprint === fingerprint()) {
    reviewButton.disabled = true;
  } else {
    reviewButton.disabled = false;
  }
  reviewPanel.hidden = true;
  setErrors([]);
}

export function refreshSlug(force = false) {
  if (state.slugManual && !force) return;
  const primary = state.rollLocation || state.frames.find((frame) => frame.location)?.location;
  fields.slug.value = deriveSlug({
    date: fields.date.value,
    stockSlug: fields.stock.value,
    placeName: primary?.name || '',
  });
}

export function renderLocation() {
  document.getElementById('roll-location-display').textContent = displayLocation(state.rollLocation);
  refreshSlug();
}

export function frameLocation(frame) {
  return frame.location || state.rollLocation;
}
