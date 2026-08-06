import { filmStocks } from '@beek/shared/film-stocks';
import { slugify } from '@beek/shared/slug';
import { releaseFrameUrls } from '../lib/image-encoder.js';
import { uploaderCapabilities } from '../lib/uploader-capabilities.mjs';
import { bindFolderIngest } from './roll-editor/folder-ingest.js';
import { bindFrames, renderFrames, setOpenLocationPicker } from './roll-editor/frames.js';
import { bindLocationPicker, openLocationPicker } from './roll-editor/location-picker.js';
import { bindPublish } from './roll-editor/publish.js';
import {
  api,
  endpoints,
  fields,
  fingerprint,
  form,
  mode,
  refreshSlug,
  renderLocation,
  routeSlug,
  setStatus,
  state,
  updateReady,
} from './roll-editor/state.js';

setOpenLocationPicker(openLocationPicker);
bindFrames();
bindFolderIngest();
bindLocationPicker();
bindPublish();

function bindMetadata() {
  [fields.title, fields.stock, fields.date, fields.draft, fields.body].forEach((element) => {
    element.addEventListener('input', () => {
      if (element === fields.stock || element === fields.date) refreshSlug();
      updateReady();
    });
  });
  fields.slug.addEventListener('input', () => {
    state.slugManual = true;
    updateReady();
  });
  fields.slug.addEventListener('change', () => { fields.slug.value = slugify(fields.slug.value); updateReady(); });
}

async function loadExisting() {
  setStatus('Loading committed Markdown and frame inventory…');
  const body = await api(`${endpoints.roll}?slug=${encodeURIComponent(routeSlug)}`);
  const roll = body.roll;
  state.source = { slug: roll.slug, markdownSha: roll.markdownSha, frames: roll.sourceFrames };
  document.getElementById('delete-roll').disabled = false;
  fields.title.value = roll.title;
  fields.stock.value = roll.stock;
  fields.date.value = roll.date;
  fields.slug.value = roll.slug;
  fields.draft.checked = roll.draft;
  fields.body.value = roll.body;
  state.rollLocation = roll.location;
  state.frames = roll.frames.map((frame) => ({
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
  state.originalFingerprint = fingerprint();
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

window.addEventListener('pagehide', () => state.frames.forEach(releaseFrameUrls));
start().catch((error) => setStatus(error.message || 'Could not start the roll editor.'));
