import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storeBytes } from '../src/lib/store-bytes.js';

test('replaceable byte store sends only encoded JPEG bytes and returns a blob reference', async () => {
  const originalFetch = globalThis.fetch;
  const sha = 'a'.repeat(40);
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ ok: true, sha, bytes: 3 }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
    assert.deepEqual(await storeBytes(bytes), { sha, bytes: 3 });
    assert.equal(captured.url, '/.netlify/functions/blob-upload');
    assert.equal(captured.options.headers['Content-Type'], 'image/jpeg');
    assert.equal(captured.options.body, bytes);
  } finally { globalThis.fetch = originalFetch; }
});

test('byte store rejects empty bytes and sanitizes a failed response', async () => {
  await assert.rejects(storeBytes(new Uint8Array()), /No encoded/);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'safe failure' }), {
    status: 502, headers: { 'Content-Type': 'application/json' },
  });
  try {
    await assert.rejects(storeBytes(new Uint8Array([1])), /safe failure/);
  } finally { globalThis.fetch = originalFetch; }
});
