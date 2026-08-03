import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public Deploy Previews are never canceled by the cached-commit build ignore rule', async () => {
  const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.match(
    config,
    /ignore\s*=\s*'if \[ "\$CONTEXT" = "deploy-preview" \]; then exit 1; fi;/,
  );
});
