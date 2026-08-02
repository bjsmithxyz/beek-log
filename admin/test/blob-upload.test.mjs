import { test } from 'node:test';
import assert from 'node:assert/strict';
import blobUpload from '../netlify/functions/blob-upload.mjs';
import { createSession, sessionCookie } from '../src/server/auth.mjs';

process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';

const session = createSession('bjsmithxyz', { access_token: 'token', expires_in: 3600 });
const cookie = sessionCookie(session).split(';')[0];

function request(bytes, { type = 'image/jpeg', origin = 'https://admin.bjsmith.xyz', authenticated = true } = {}) {
  return new Request('https://admin.bjsmith.xyz/.netlify/functions/blob-upload', {
    method: 'POST',
    headers: {
      'Content-Type': type,
      Origin: origin,
      ...(authenticated ? { Cookie: cookie } : {}),
    },
    body: bytes,
  });
}

test('blob proxy verifies JPEG and stores base64 bytes without accepting a path', async () => {
  const originalFetch = globalThis.fetch;
  const sha = 'a'.repeat(40);
  let sent;
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/git\/blobs$/);
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ sha }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const response = await blobUpload(request(bytes));
    assert.equal(response.status, 201);
    assert.deepEqual(JSON.parse(await response.text()), { ok: true, sha, bytes: 7 });
    assert.equal(sent.encoding, 'base64');
    assert.deepEqual(Buffer.from(sent.content, 'base64'), Buffer.from(bytes));
    assert.deepEqual(Object.keys(sent).sort(), ['content', 'encoding']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('blob proxy refuses wrong content, origin and session before GitHub', async () => {
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => { fetches += 1; throw new Error('must not fetch'); };
  try {
    assert.equal((await blobUpload(request(new Uint8Array([1, 2, 3])))).status, 400);
    assert.equal((await blobUpload(request(new Uint8Array([0xff, 0xd8, 0xff]), { type: 'text/plain' }))).status, 415);
    assert.equal((await blobUpload(request(new Uint8Array([0xff, 0xd8, 0xff]), { origin: 'https://evil.example' }))).status, 403);
    assert.equal((await blobUpload(request(new Uint8Array([0xff, 0xd8, 0xff]), { authenticated: false }))).status, 401);
    assert.equal(fetches, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
