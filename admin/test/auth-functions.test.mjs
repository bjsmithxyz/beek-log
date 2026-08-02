import { test } from 'node:test';
import assert from 'node:assert/strict';
import authLogin from '../netlify/functions/auth-login.mjs';
import authLogout from '../netlify/functions/auth-logout.mjs';

process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';
process.env.GITHUB_CLIENT_ID = 'github-app-client';

test('GitHub App login uses PKCE, state and no OAuth public_repo scope', async () => {
  const response = await authLogin(new Request('https://admin.bjsmith.xyz/.netlify/functions/auth-login?next=/rolls/new'));
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.origin, 'https://github.com');
  assert.equal(location.searchParams.get('client_id'), 'github-app-client');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(location.searchParams.get('state'));
  assert.equal(location.searchParams.has('scope'), false);
  assert.match(response.headers.get('set-cookie'), /__Host-beek_oauth_state=/);
});

test('login replaces an unsafe next path with the dashboard', async () => {
  const response = await authLogin(new Request('https://admin.bjsmith.xyz/.netlify/functions/auth-login?next=//evil.example'));
  assert.equal(response.status, 302);
  assert.ok(response.headers.get('set-cookie'));
});

test('logout checks method, JSON and same-origin before clearing cookies', async () => {
  assert.equal((await authLogout(new Request('https://admin.bjsmith.xyz/x'))).status, 405);
  assert.equal((await authLogout(new Request('https://admin.bjsmith.xyz/x', {
    method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'text/plain' },
  }))).status, 415);
  assert.equal((await authLogout(new Request('https://admin.bjsmith.xyz/x', {
    method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
  }))).status, 403);
  const response = await authLogout(new Request('https://admin.bjsmith.xyz/x', {
    method: 'POST', headers: { Origin: 'https://admin.bjsmith.xyz', 'Content-Type': 'application/json' },
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});
