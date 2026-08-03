import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const configUrl = new URL('../netlify.toml', import.meta.url);

test('public Deploy Previews are never canceled by the cached-commit build ignore rule', async () => {
  const config = await readFile(configUrl, 'utf8');
  assert.match(
    config,
    /ignore\s*=\s*'if \[ "\$CONTEXT" = "deploy-preview" \]; then exit 1; fi;/,
  );
});

test('the retired travel-project work permalink redirects to the site post', async () => {
  const config = await readFile(configUrl, 'utf8');
  assert.match(
    config,
    /from\s*=\s*"\/work\/the-long-way-round\/"\s+to\s*=\s*"\/work\/bjsmith-xyz\/"\s+status\s*=\s*301/s,
  );
});
