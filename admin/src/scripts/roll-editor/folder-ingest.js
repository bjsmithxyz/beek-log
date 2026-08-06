import { filmStocks } from '@beek/shared/film-stocks';
import { parseFolderName } from '@beek/shared/folder-name';
import { encodeFiles } from '../../lib/image-encoder.js';
import { renderFrames } from './frames.js';
import {
  fields,
  refreshSlug,
  setStatus,
  state,
  updateReady,
} from './state.js';

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
      state.frames.push({
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
    setStatus(`${state.frames.length} frames ready.`);
  } catch (error) {
    if (error.name === 'AbortError') return;
    setStatus(error.message || 'Could not read and encode that folder.');
  }
}

export function bindFolderIngest() {
  document.getElementById('pick-folder').addEventListener('click', pickFolder);
}
