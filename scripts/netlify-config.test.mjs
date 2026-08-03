import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ADMIN_CSP, ADMIN_SECURITY_HEADERS } from '../admin/src/server/headers.mjs';

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8');

/** Every `for = "…"` block in a netlify.toml that sets a CSP. */
function cspBlocks(config) {
  return [...config.matchAll(/\[\[headers\]\]\s*\n\s*for = "([^"]+)"\s*\n\s*\[headers\.values\]\n((?:\s{4}.*\n)+)/g)]
    .map(([, route, body]) => ({ route, csp: (body.match(/Content-Security-Policy = "([^"]+)"/) || [])[1] }))
    .filter((block) => block.csp);
}

function directive(csp, name) {
  const found = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name} `));
  return found ? found.slice(name.length + 1).split(/\s+/) : [];
}

/** CSP host-source match, including the leading-wildcard form. */
function permits(sources, host) {
  return sources.some((source) => {
    const value = source.replace(/^https:\/\//, '');
    if (value === host) return true;
    return value.startsWith('*.') && host.endsWith(value.slice(1));
  });
}

test('public Deploy Previews are never canceled by the cached-commit build ignore rule', async () => {
  const config = await read('../netlify.toml');
  assert.match(
    config,
    /ignore\s*=\s*'if \[ "\$CONTEXT" = "deploy-preview" \]; then exit 1; fi;/,
  );
});

// Regression guard. A per-route CSP silently stops applying once ClientRouter
// is in play: it swaps documents without a navigation, so the browser keeps
// enforcing whichever policy the first-loaded page carried. Scoping the map and
// weather origins to /travel meant reaching it from any internal link blocked
// every tile and forecast while a direct load worked.
test('the public site serves exactly one CSP, because ClientRouter defeats per-route policies', async () => {
  const blocks = cspBlocks(await read('../netlify.toml'));
  assert.deepEqual(
    blocks.map((block) => block.route),
    ['/*'],
    'a route-scoped CSP cannot hold under client-side navigation — keep one site-wide policy',
  );
});

test('the public CSP permits every external origin the travel page requests', async () => {
  const [{ csp }] = cspBlocks(await read('../netlify.toml'));
  const client = await read('../src/scripts/travel-client.js');

  // Leaflet substitutes a real subdomain for {s} at request time, so resolve it
  // to a concrete label — CSP's `*.example.com` deliberately does not match the
  // bare apex, and checking the stripped host would pass a policy that fails.
  const hosts = [...new Set([...client.matchAll(/https:\/\/([a-z0-9.{}-]+\.[a-z]{2,})/g)]
    .map(([, host]) => host.replace('{s}', 'a')))];

  assert.ok(hosts.length > 0, 'expected the travel client to reference external origins');
  for (const host of hosts) {
    const allowed = permits(directive(csp, 'img-src'), host) || permits(directive(csp, 'connect-src'), host);
    assert.ok(allowed, `travel-client.js requests ${host} but no CSP directive allows it`);
  }
});

test('the admin CSP is identical in headers.mjs and admin/netlify.toml', async () => {
  const blocks = cspBlocks(await read('../admin/netlify.toml'));
  const siteWide = blocks.find((block) => block.route === '/*');
  assert.ok(siteWide, 'admin must set a site-wide CSP');
  assert.equal(
    siteWide.csp,
    ADMIN_CSP,
    'admin/netlify.toml and headers.mjs must stay byte-identical — SSR and Function responses use the JS copy, static assets the TOML copy',
  );
});

test('every admin security header is mirrored in admin/netlify.toml', async () => {
  const config = await read('../admin/netlify.toml');
  for (const [name, value] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    if (name === 'Content-Security-Policy') continue;
    const found = config.match(new RegExp(`^\\s*${name} = "([^"]+)"`, 'm'));
    assert.ok(found, `admin/netlify.toml is missing ${name}`);
    assert.equal(found[1], value, `${name} drifted between headers.mjs and admin/netlify.toml`);
  }
});
