// Build-time regression guard: all date-derived travel state must be filled by
// the browser, never frozen into the prerendered HTML.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/travel/index.html', import.meta.url), 'utf8');

assert.match(html, /id="travel-day"[^>]*><\/b>/, 'travel day count must be empty in built HTML');
assert.match(html, /id="travel-start"[^>]*><\/b>/, 'trip start label must be client-rendered');
assert.doesNotMatch(html, /data-status="(?:past|current|future)"/, 'trip status must not be prerendered');
assert.doesNotMatch(html, /edit trip|save to github/i, 'public travel page must not contain editor UI');
console.log('travel prerender guard: ok');
