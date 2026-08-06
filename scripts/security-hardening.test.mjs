import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('travel page escapes < in the embedded JSON payload', async () => {
  const source = await readFile(new URL('../src/pages/travel/index.astro', import.meta.url), 'utf8');
  assert.match(source, /id="travel-data"/);
  assert.ok(
    source.includes(".replace(/</g, '\\\\u003c')") || source.includes('.replace(/</g, "\\u003c")'),
    'travel JSON embed must escape < like JsonLd to prevent </script> breakout',
  );
});

test('public markdown pipeline sanitizes raw HTML', async () => {
  const config = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /rehypeSanitize/);
  assert.match(config, /rehypeRaw/);
  assert.match(config, /unified\(/);
});
