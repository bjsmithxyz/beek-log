// Credential-free production smoke checks. Authenticated owner flows remain a
// manual operations check; this script verifies the public boundary, DNS,
// compatibility redirect, robots policy, and signed-out admin hardening.
import assert from 'node:assert/strict';
import { resolveCname } from 'node:dns/promises';

const TIMEOUT_MS = 20_000;
const USER_AGENT = 'beek-log-production-verifier/1.0';

async function request(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'user-agent': USER_AGENT,
      ...options.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function expectCname(hostname, expected) {
  const records = (await resolveCname(hostname))
    .map((record) => record.toLowerCase().replace(/\.$/, ''));
  assert.ok(
    records.includes(expected),
    `${hostname} CNAME must include ${expected}; received ${records.join(', ') || 'none'}`,
  );
  console.log(`dns: ${hostname} -> ${expected}`);
}

async function expectOk(url) {
  const response = await request(url);
  assert.equal(response.status, 200, `${url} must return HTTP 200`);
  console.log(`http: 200 ${url}`);
  return response;
}

function expectHeader(response, name, pattern) {
  const value = response.headers.get(name) || '';
  assert.match(value, pattern, `${name} did not match ${pattern}: ${value || '<missing>'}`);
}

await expectCname('admin.bjsmith.xyz', 'beekadmin.netlify.app');
await expectCname('travel.bjsmith.xyz', 'beek-log.netlify.app');

for (const url of [
  'https://bjsmith.xyz/',
  'https://bjsmith.xyz/photos/',
  'https://bjsmith.xyz/travel/',
  'https://admin.bjsmith.xyz/',
]) {
  const response = await expectOk(url);
  await response.body?.cancel();
}

const redirect = await request('https://travel.bjsmith.xyz/test-path?gate=1', {
  redirect: 'manual',
});
assert.equal(redirect.status, 301, 'travel compatibility host must redirect permanently');
assert.equal(
  redirect.headers.get('location'),
  'https://bjsmith.xyz/travel/test-path?gate=1',
  'travel redirect must preserve the path and query string',
);
expectHeader(redirect, 'strict-transport-security', /includeSubDomains/i);
console.log('redirect: travel path and query preserved');

const robots = await expectOk('https://admin.bjsmith.xyz/robots.txt');
const robotsText = await robots.text();
assert.match(robotsText, /^User-agent:\s*\*/im, 'admin robots policy must target every crawler');
assert.match(robotsText, /^Disallow:\s*\/$/im, 'admin robots policy must disallow the complete site');
console.log('robots: admin site disallowed');

const auth = await request('https://admin.bjsmith.xyz/.netlify/functions/auth-me');
assert.equal(auth.status, 401, 'signed-out admin identity request must return HTTP 401');
expectHeader(auth, 'cache-control', /(?:^|,)\s*no-store(?:\s*(?:,|$))/i);
expectHeader(auth, 'content-security-policy', /frame-ancestors 'none'/i);
expectHeader(auth, 'strict-transport-security', /includeSubDomains/i);
expectHeader(auth, 'x-frame-options', /^DENY$/i);
expectHeader(auth, 'x-robots-tag', /noindex/i);
console.log('admin: signed-out identity and security headers verified');

console.log('production smoke checks: ok');
