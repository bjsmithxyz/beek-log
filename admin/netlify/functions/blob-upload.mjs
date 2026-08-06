import { env, githubHeaders, json } from '../../src/server/auth.mjs';
import { takeRateLimit } from '../../src/server/rate-limit.mjs';
import { mutationResponse, requireBinaryMutation } from '../../src/server/request-guards.mjs';

const SHA = /^[0-9a-f]{40}$/;
const UPLOAD_LIMIT = { limit: 30, windowMs: 60_000 };

export default async function blobUpload(request) {
  const context = await requireBinaryMutation(request);
  if (context.response) return context.response;
  const limited = takeRateLimit(`blob:${context.session.login}`, UPLOAD_LIMIT);
  if (!limited.ok) {
    return mutationResponse(json(429, {
      ok: false,
      error: 'Too many image uploads; try again shortly.',
      code: 'rate_limited',
    }, { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) }), context);
  }
  const bytes = context.bytes;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return mutationResponse(json(400, { ok: false, error: 'Encoded file is not a JPEG' }), context);
  }
  const owner = env('GITHUB_REPOSITORY_OWNER', 'bjsmithxyz');
  const repo = env('GITHUB_REPOSITORY_NAME', 'beek-log');
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers: { ...githubHeaders(context.session.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: Buffer.from(bytes).toString('base64'), encoding: 'base64' }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !SHA.test(body.sha || '')) throw new Error('blob upload failed');
    return mutationResponse(json(201, { ok: true, sha: body.sha, bytes: bytes.byteLength }), context);
  } catch {
    return mutationResponse(json(502, { ok: false, error: 'GitHub could not store the encoded image' }), context);
  }
}
