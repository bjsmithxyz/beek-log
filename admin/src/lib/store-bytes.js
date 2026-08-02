// The uploader depends on this single storage boundary. A future object-store
// migration can replace this function without changing the encoder, editor or
// generic publication operation builder.
export async function storeBytes(bytes, { signal } = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error('No encoded image bytes');
  const response = await fetch('/.netlify/functions/blob-upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'image/jpeg' },
    body: bytes,
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !/^[0-9a-f]{40}$/.test(body.sha || '')) {
    throw new Error(body.error || `Image storage failed (${response.status})`);
  }
  return { sha: body.sha, bytes: body.bytes };
}
