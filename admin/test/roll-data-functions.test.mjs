import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRollMarkdown } from '@beek/shared/roll-markdown';
import rollData from '../netlify/functions/roll-data.mjs';
import rollsData from '../netlify/functions/rolls-data.mjs';
import { createSession, sessionCookie } from '../src/server/auth.mjs';

process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';
const commit = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const markdownSha = 'c'.repeat(40);
const imageOne = 'd'.repeat(40);
const imageTwo = 'e'.repeat(40);
const slug = '2026-08-kodak-portra-400-london';
const cookie = sessionCookie(createSession('bjsmithxyz', { access_token: 'token', expires_in: 3600 })).split(';')[0];
const markdown = buildRollMarkdown({
  title: 'London', stock: 'kodak-portra-400', date: '2026-08-02',
  location: { name: 'London', lat: 51.5, lng: -0.1 }, draft: true, body: 'Notes',
  photos: [
    { src: `../../assets/photos/${slug}/001.jpg`, alt: '' },
    { src: `../../assets/photos/${slug}/002.jpg`, alt: 'Street', caption: 'Night' },
  ],
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetch() {
  return async (url) => {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`;
    if (path.endsWith('/git/ref/heads/main')) return json({ object: { sha: commit } });
    if (path.endsWith(`/git/commits/${commit}`)) return json({ tree: { sha: treeSha } });
    if (path.endsWith(`/git/trees/${treeSha}?recursive=1`)) return json({ truncated: false, tree: [
      { path: `src/content/photos/${slug}.md`, type: 'blob', sha: markdownSha },
      { path: `src/assets/photos/${slug}/001.jpg`, type: 'blob', sha: imageOne },
      { path: `src/assets/photos/${slug}/002.jpg`, type: 'blob', sha: imageTwo },
    ] });
    if (path.endsWith(`/git/blobs/${markdownSha}`)) return json({
      encoding: 'base64', content: Buffer.from(markdown).toString('base64'),
    });
    throw new Error(`Unexpected repository request ${path}`);
  };
}

function request(path) {
  return new Request(`https://admin.bjsmith.xyz/.netlify/functions/${path}`, { headers: { Cookie: cookie } });
}

test('roll list exposes only guarded slugs and Markdown SHAs', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch();
  try {
    const response = await rollsData(request('rolls-data'));
    const body = JSON.parse(await response.text());
    assert.deepEqual(body.rolls, [{ slug, markdownSha }]);
  } finally { globalThis.fetch = originalFetch; }
});

test('roll loader joins Markdown to exact sequential image inventory', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch();
  try {
    const response = await rollData(request(`roll-data?slug=${slug}`));
    assert.equal(response.status, 200);
    const body = JSON.parse(await response.text());
    assert.equal(body.roll.frames.length, 2);
    assert.equal(body.roll.frames[1].blobSha, imageTwo);
    assert.equal(body.roll.frames[1].caption, 'Night');
    assert.match(body.roll.frames[0].imageUrl, new RegExp(`${commit}/src/assets/photos/${slug}/001.jpg$`));
    assert.deepEqual(body.roll.sourceFrames, [
      { path: `src/assets/photos/${slug}/001.jpg`, sha: imageOne },
      { path: `src/assets/photos/${slug}/002.jpg`, sha: imageTwo },
    ]);
  } finally { globalThis.fetch = originalFetch; }
});
