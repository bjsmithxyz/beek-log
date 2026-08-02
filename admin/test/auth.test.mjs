import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_COOKIE,
  allowedLogin,
  createSession,
  isSameOrigin,
  parseCookies,
  readSession,
  seal,
  sessionCookie,
  unseal,
  validateNext,
} from '../src/server/auth.mjs';

const originalEnv = { ...process.env };
process.env.SESSION_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
process.env.ADMIN_SITE_URL = 'https://admin.bjsmith.xyz';
process.env.GITHUB_CLIENT_ID = 'client-id';
process.env.GITHUB_CLIENT_SECRET = 'client-secret';

test.after(() => {
  process.env = originalEnv;
});

test('next validator permits one same-origin path slash and rejects open redirects', () => {
  assert.equal(validateNext('/'), '/');
  assert.equal(validateNext('/rolls/new'), '/rolls/new');
  assert.equal(validateNext('/rolls/example-1'), '/rolls/example-1');
  assert.equal(validateNext('//evil.example'), '/');
  assert.equal(validateNext('/%2f%2fevil.example'), '/');
  assert.equal(validateNext('/rolls?next=evil'), '/');
  assert.equal(validateNext('https://evil.example'), '/');
});

test('AES-256-GCM session sealing round-trips and detects tampering', () => {
  const value = seal({ login: 'bjsmithxyz', token: 'secret-token' });
  assert.deepEqual(unseal(value), { login: 'bjsmithxyz', token: 'secret-token' });
  const tampered = Buffer.from(value, 'base64url');
  tampered[28] ^= 1;
  assert.throws(() => unseal(tampered.toString('base64url')));
});

test('allow-list configuration contains exactly one login', () => {
  assert.equal(allowedLogin(), 'bjsmithxyz');
  process.env.OAUTH_ALLOWED_USERS = 'one,two';
  assert.throws(() => allowedLogin(), /exactly one/);
  process.env.OAUTH_ALLOWED_USERS = 'bjsmithxyz';
});

test('same-origin checks use the configured admin origin', () => {
  assert.equal(isSameOrigin(new Request('https://admin.bjsmith.xyz/x', {
    headers: { Origin: 'https://admin.bjsmith.xyz' },
  })), true);
  assert.equal(isSameOrigin(new Request('https://admin.bjsmith.xyz/x', {
    headers: { Origin: 'https://evil.example' },
  })), false);
  assert.equal(isSameOrigin(new Request('https://admin.bjsmith.xyz/x')), false);
});

test('session cookie is host-only, secure, httpOnly, Lax and expires after 24 hours', () => {
  const now = 1_000_000;
  const session = createSession('bjsmithxyz', { access_token: 'token', expires_in: 28_800 }, now);
  const header = sessionCookie(session, now);
  assert.match(header, new RegExp(`^${SESSION_COOKIE}=`));
  assert.match(header, /Path=\/;/);
  assert.match(header, /HttpOnly/);
  assert.match(header, /Secure/);
  assert.match(header, /SameSite=Lax/);
  assert.match(header, /Max-Age=86400/);
  assert.doesNotMatch(header, /Domain=/i);
});

test('readSession refreshes an expiring GitHub token without extending session TTL', async () => {
  const now = 2_000_000;
  const original = createSession('bjsmithxyz', {
    access_token: 'old-token', refresh_token: 'old-refresh', expires_in: 1,
    refresh_token_expires_in: 1_000_000,
  }, now);
  const request = new Request('https://admin.bjsmith.xyz/', {
    headers: { Cookie: sessionCookie(original, now).split(';')[0] },
  });
  const calls = [];
  const result = await readSession(request, {
    now: now + 2_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({
        access_token: 'new-token', refresh_token: 'new-refresh', expires_in: 28_800,
        refresh_token_expires_in: 1_000_000,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });
  assert.equal(calls.length, 1);
  assert.equal(result.session.token, 'new-token');
  assert.equal(result.session.refreshToken, 'new-refresh');
  assert.equal(result.session.expiresAt, original.expiresAt);
  assert.ok(result.setCookie);
  const sealed = parseCookies(result.setCookie)[SESSION_COOKIE];
  assert.equal(unseal(sealed).expiresAt, original.expiresAt);
});

test('readSession clears an expired absolute session without refreshing', async () => {
  const now = 3_000_000;
  const expired = createSession('bjsmithxyz', { access_token: 'token' }, now - 90_000_000);
  const request = new Request('https://admin.bjsmith.xyz/', {
    headers: { Cookie: sessionCookie(expired, now - 90_000_000).split(';')[0] },
  });
  const result = await readSession(request, { now, fetchImpl: async () => { throw new Error('must not fetch'); } });
  assert.equal(result.session, null);
  assert.match(result.setCookie, /Max-Age=0/);
});
