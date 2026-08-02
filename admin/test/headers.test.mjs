import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_SECURITY_HEADERS,
  applyAdminSecurityHeaders,
} from '../src/server/headers.mjs';

test('SSR and Function responses receive the complete admin security policy', () => {
  const response = applyAdminSecurityHeaders(new Response('ok'));
  for (const [name, expected] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    assert.equal(response.headers.get(name), expected, name);
  }
  assert.match(response.headers.get('Content-Security-Policy'), /script-src 'self' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(response.headers.get('Content-Security-Policy'), /script-src[^;]*unsafe-inline/);
  assert.match(response.headers.get('Content-Security-Policy'), /https:\/\/raw\.githubusercontent\.com/);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
});
