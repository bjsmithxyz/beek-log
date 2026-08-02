import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, sessionCookie } from '../src/server/auth.mjs';
import { requireJsonMutation } from '../src/server/request-guards.mjs';

process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';

function request({ method = 'POST', type = 'application/json', origin = 'https://admin.bjsmith.xyz', body = '{}' } = {}) {
  const headers = { 'Content-Type': type, Origin: origin };
  return new Request('https://admin.bjsmith.xyz/.netlify/functions/publish-start', { method, headers, ...(method === 'GET' ? {} : { body }) });
}

test('mutation guards enforce method, content type, origin, then session', async () => {
  assert.equal((await requireJsonMutation(request({ method: 'GET', type: 'text/plain', origin: 'https://evil.example' }))).response.status, 405);
  assert.equal((await requireJsonMutation(request({ type: 'text/plain', origin: 'https://evil.example' }))).response.status, 415);
  assert.equal((await requireJsonMutation(request({ origin: 'https://evil.example' }))).response.status, 403);
  assert.equal((await requireJsonMutation(request())).response.status, 401);
});

test('authenticated mutation parsing enforces byte limits and valid JSON', async () => {
  const now = Date.now();
  const session = createSession('bjsmithxyz', { access_token: 'token', expires_in: 3600 }, now);
  const cookie = sessionCookie(session, now).split(';')[0];
  const make = (body) => new Request('https://admin.bjsmith.xyz/.netlify/functions/publish-start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://admin.bjsmith.xyz', Cookie: cookie },
    body,
  });
  assert.equal((await requireJsonMutation(make('not-json'))).response.status, 400);
  assert.equal((await requireJsonMutation(make(JSON.stringify({ text: 'too much' })), { maxBytes: 4 })).response.status, 413);
  const valid = await requireJsonMutation(make('{"ok":true}'));
  assert.deepEqual(valid.body, { ok: true });
  assert.equal(valid.session.login, 'bjsmithxyz');
});
