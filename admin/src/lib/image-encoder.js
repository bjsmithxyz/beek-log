const WORKERS = 2;

async function encodeOne(worker, file, id) {
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      if (event.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (event.data.ok) resolve(event.data);
      else reject(new Error(event.data.error || `Could not encode ${file.name}`));
    };
    const onError = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(new Error(`Image worker failed while encoding ${file.name}`));
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ id, name: file.name, type: file.type || 'application/octet-stream', buffer }, [buffer]);
  });
}

export async function encodeFiles(files, { onProgress = () => {} } = {}) {
  const queue = [...files];
  const results = new Array(queue.length);
  let next = 0;
  let complete = 0;
  const workerCount = Math.min(WORKERS, queue.length);
  const workers = Array.from({ length: workerCount }, () => new Worker(
    new URL('../workers/image-encoder.worker.js', import.meta.url),
    { type: 'module' },
  ));
  try {
    await Promise.all(workers.map(async (worker) => {
      while (next < queue.length) {
        const index = next++;
        const file = queue[index];
        onProgress({ phase: 'encoding', index, complete, total: queue.length, name: file.name });
        results[index] = await encodeOne(worker, file, `${index}-${crypto.randomUUID()}`);
        complete += 1;
        onProgress({ phase: 'encoded', index, complete, total: queue.length, name: file.name });
      }
    }));
    return results;
  } finally {
    workers.forEach((worker) => worker.terminate());
  }
}

export function releaseFrameUrls(frame) {
  if (frame.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(frame.thumbUrl);
  if (frame.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(frame.previewUrl);
}
