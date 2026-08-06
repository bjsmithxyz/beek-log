import { test } from 'node:test';
import assert from 'node:assert/strict';
import publishStart from '../netlify/functions/publish-start.mjs';
import travelData from '../netlify/functions/travel-data.mjs';
import { publishRoll, handler as legacyPublishRoll } from '../netlify/functions/publish-roll.mjs';
import rollsData from '../netlify/functions/rolls-data.mjs';
import rollData from '../netlify/functions/roll-data.mjs';
import geocode from '../netlify/functions/geocode.mjs';
import { createSession, sessionCookie } from '../src/server/auth.mjs';

process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';

const session = createSession('bjsmithxyz', { access_token: 'token', expires_in: 3600 });
const cookie = sessionCookie(session).split(';')[0];

function post(path, body, authenticated = true) {
  return new Request(`https://admin.bjsmith.xyz/.netlify/functions/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://admin.bjsmith.xyz',
      ...(authenticated ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

test('all publishing data/control functions refuse signed-out requests', async () => {
  assert.equal((await publishStart(post('publish-start', {}, false))).status, 401);
  assert.equal((await travelData(new Request('https://admin.bjsmith.xyz/.netlify/functions/travel-data'))).status, 401);
  assert.equal((await publishRoll(post('publish-roll', {}, false))).status, 401);
  assert.equal((await rollsData(new Request('https://admin.bjsmith.xyz/.netlify/functions/rolls-data'))).status, 401);
  assert.equal((await rollData(new Request('https://admin.bjsmith.xyz/.netlify/functions/roll-data?slug=test'))).status, 401);
  assert.equal((await geocode(post('geocode', { kind: 'place', query: 'London' }, false))).status, 401);
});

test('roll publisher supports Netlify v1 runtime classification', async () => {
  const response = await legacyPublishRoll({
    rawUrl: 'https://admin.bjsmith.xyz/.netlify/functions/publish-roll',
    httpMethod: 'GET',
    headers: { host: 'admin.bjsmith.xyz' },
  });
  assert.equal(response.statusCode, 405);
  assert.match(response.body, /Method not allowed/);
});

test('schema failures occur before any GitHub request', async () => {
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches += 1;
    throw new Error('remote fetch must not run');
  };
  try {
    const start = await publishStart(post('publish-start', {
      requestId: '123e4567-e89b-42d3-a456-426614174000',
      expectedSha: 'a'.repeat(40),
      trips: { meta: { title: 'Trip', subtitle: '' }, stops: [], unknown: true },
    }));
    assert.equal(start.status, 400);
    assert.equal((await publishRoll(post('publish-roll', { mode: 'create', requestId: 'bad', roll: {} }))).status, 400);
    assert.equal(fetches, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
