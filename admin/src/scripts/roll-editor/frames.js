import { escapeHtml } from '@beek/shared/escape-html';
import { fillForward } from '@beek/shared/loc-utils';
import { releaseFrameUrls } from '../../lib/image-encoder.js';
import {
  displayLocation,
  frameGrid,
  frameCount,
  frameLocation,
  refreshSlug,
  setStatus,
  state,
  updateReady,
} from './state.js';

let openLocationPicker = () => {};

export function setOpenLocationPicker(fn) {
  openLocationPicker = fn;
}

export function renderFrames() {
  frameCount.textContent = `(${state.frames.length})`;
  frameGrid.innerHTML = state.frames.map((frame, index) => `
    <article class="roll-frame" draggable="true" data-index="${index}">
      <div class="frame-head">
        <label class="frame-select"><input type="checkbox" data-select ${frame.selected ? 'checked' : ''}><span class="frame-number">#${String(index + 1).padStart(3, '0')}</span></label>
        <div class="frame-actions">
          <button type="button" data-action="left" aria-label="Move frame ${index + 1} left" ${index === 0 ? 'disabled' : ''}>←</button>
          <button type="button" data-action="right" aria-label="Move frame ${index + 1} right" ${index === state.frames.length - 1 ? 'disabled' : ''}>→</button>
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

export function moveFrame(from, to) {
  if (from < 0 || to < 0 || from >= state.frames.length || to >= state.frames.length || from === to) return;
  const [frame] = state.frames.splice(from, 1);
  state.frames.splice(to, 0, frame);
  renderFrames();
  updateReady();
  frameGrid.querySelector(`[data-index="${to}"] [data-preview]`)?.focus();
}

export function openImagePreview(frame) {
  const dialog = document.getElementById('image-preview');
  document.getElementById('preview-image').src = frame.previewUrl || frame.thumbUrl;
  dialog.showModal();
}

export function bindFrames() {
  frameGrid.addEventListener('input', (event) => {
    const card = event.target.closest('.roll-frame');
    if (!card) return;
    const frame = state.frames[Number(card.dataset.index)];
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
      releaseFrameUrls(state.frames[index]);
      state.frames.splice(index, 1);
      renderFrames();
      updateReady();
    }
    if (action === 'location') {
      openLocationPicker(frameLocation(state.frames[index]), (value) => {
        fillForward(state.frames, index, value);
        renderFrames();
        refreshSlug();
        updateReady();
      });
    }
    if (event.target.matches('[data-preview]')) openImagePreview(state.frames[index]);
  });

  frameGrid.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-preview]')) {
      event.preventDefault();
      const index = Number(event.target.closest('.roll-frame').dataset.index);
      openImagePreview(state.frames[index]);
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

  document.getElementById('select-all-frames').addEventListener('click', () => {
    const all = state.frames.length > 0 && state.frames.every((frame) => frame.selected);
    state.frames.forEach((frame) => { frame.selected = !all; });
    renderFrames();
  });

  document.getElementById('bulk-frame-location').addEventListener('click', () => {
    const selected = state.frames.map((frame, index) => frame.selected ? index : -1).filter((index) => index >= 0);
    if (!selected.length) {
      setStatus('Select at least one frame first.');
      return;
    }
    openLocationPicker(null, (value) => {
      selected.forEach((index) => {
        state.frames[index].location = value;
        state.frames[index].explicit = true;
      });
      renderFrames();
      refreshSlug();
      updateReady();
    });
  });

  document.getElementById('close-image-preview').addEventListener('click', () => document.getElementById('image-preview').close());
  document.getElementById('image-preview').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
}
