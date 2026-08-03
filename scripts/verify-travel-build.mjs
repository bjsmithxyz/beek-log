// Build-time regression guard: all date-derived travel state must be filled by
// the browser, never frozen into the prerendered HTML.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/travel/index.html', import.meta.url), 'utf8');

assert.match(html, /<h1[^>]*class="page-title"[^>]*>travel<\/h1>/, 'travel must use the shared page-title scale');
assert.doesNotMatch(html, /Long Way Round/, 'retired travel title must not ship');
assert.match(html, /role="tablist"[^>]*aria-label="Travel sections"/, 'travel section tabs must be built');
assert.doesNotMatch(html, /data-travel-panel="timeline"[^>]*>\s*<div class="travel-section-head"/, 'timeline panel must not repeat the tab label');
assert.doesNotMatch(html, /The whole journey, latest date first/, 'timeline panel must not describe the retired ordering');
assert.doesNotMatch(html, /Trip started|Weather via Open-Meteo/, 'legacy travel footer must be removed');
assert.doesNotMatch(html, /data-status="(?:past|current|future)"/, 'trip status must not be prerendered');
assert.doesNotMatch(html, /edit trip|save to github/i, 'public travel page must not contain editor UI');
console.log('travel prerender guard: ok');
