import { filmStocks } from '@beek/shared/film-stocks';
import { rollInputErrors } from '@beek/shared/roll-markdown';
import { storeBytes } from '../../lib/store-bytes.js';
import {
  currentRoll,
  endpoints,
  errorsPanel,
  fields,
  form,
  mode,
  post,
  publicationError,
  publicationStatus,
  reviewButton,
  reviewPanel,
  reviewSummary,
  setErrors,
  setStatus,
  state,
  updateReady,
  uploadProgress,
} from './state.js';

export function formErrors() {
  const roll = currentRoll();
  const errors = [];
  if (!roll.title) errors.push('title is required');
  errors.push(...rollInputErrors({
    slug: roll.slug,
    sourceSlug: state.source?.slug,
    stock: roll.stock,
    date: roll.date,
    location: roll.location,
    frames: roll.frames,
  }, filmStocks));
  return errors;
}

async function uploadNewFrames() {
  const pending = state.frames.filter((frame) => !frame.blobSha);
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
  return state.source ? {
    slug: state.source.slug,
    markdownSha: state.source.markdownSha,
    frames: state.source.frames.map((frame) => ({ path: frame.path, sha: frame.sha })),
  } : null;
}

async function createRollPublication() {
  const button = document.getElementById('publish-roll');
  button.disabled = true;
  state.publishing = true;
  publicationError.hidden = true;
  publicationError.textContent = '';
  form.disabled = true;
  reviewButton.disabled = true;
  state.pendingRequestId ||= crypto.randomUUID();
  try {
    let request;
    if (state.pendingDelete) {
      request = { requestId: state.pendingRequestId, mode: 'delete', source: sourcePayload() };
    } else {
      await uploadNewFrames();
      const roll = currentRoll();
      request = {
        requestId: state.pendingRequestId,
        mode,
        ...(state.source ? { source: sourcePayload() } : {}),
        roll,
      };
    }
    publicationStatus.textContent = 'Committing roll to main…';
    const body = await post(endpoints.publish, request);
    state.pendingRequestId = null;
    const sha = body.publication?.commitSha?.slice(0, 7) || 'main';
    publicationStatus.textContent = `Published ${sha}. Production will rebuild from main.`;
    setStatus(`Published ${sha}. Redirecting…`);
    await new Promise((resolve) => setTimeout(resolve, 750));
    location.href = '/rolls/';
  } catch (error) {
    if (error.status === 409) state.pendingRequestId = null;
    state.publishing = false;
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

export function bindPublish() {
  reviewButton.addEventListener('click', () => {
    state.pendingDelete = false;
    const errors = formErrors();
    if (errors.length) {
      setErrors(errors);
      errorsPanel.scrollIntoView({ block: 'start' });
      return;
    }
    const newFrames = state.frames.filter((frame) => !frame.blobSha).length;
    reviewSummary.textContent = `${mode === 'create' ? 'Create' : 'Update'} “${fields.title.value.trim()}” with ${state.frames.length} frames; ${newFrames} require upload; ${fields.draft.checked ? 'draft' : 'published'}.`;
    publicationError.hidden = true;
    publicationError.textContent = '';
    publicationStatus.textContent = '';
    document.getElementById('publish-roll').textContent = 'upload + publish to main →';
    reviewPanel.hidden = false;
    reviewPanel.focus();
  });

  document.getElementById('cancel-roll-review').addEventListener('click', () => {
    state.pendingDelete = false;
    reviewPanel.hidden = true;
  });

  document.getElementById('publish-roll').addEventListener('click', createRollPublication);

  if (mode === 'edit') {
    document.getElementById('delete-roll').addEventListener('click', () => {
      const typed = prompt(`Type the complete slug to delete this roll:\n\n${state.source.slug}`);
      if (typed !== state.source.slug) {
        setStatus('Delete cancelled; slug did not match exactly.');
        return;
      }
      state.pendingDelete = true;
      reviewSummary.textContent = `Delete “${state.source.slug}” and all ${state.source.frames.length} committed frames. This commits the deletion to main.`;
      publicationStatus.textContent = '';
      document.getElementById('publish-roll').textContent = 'delete on main →';
      reviewPanel.hidden = false;
      reviewPanel.focus();
    });
  }
}
