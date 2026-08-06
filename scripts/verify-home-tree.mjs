// Build-time guard for the homepage site-tree disclosures (and theme toggle).
//
// Tree toggles must answer a click as soon as their module has run. Binding
// only on astro:page-load left the file-system UI dead on a cold load: that
// event waits for window `load` (every subresource), so the page looked ready
// while expand/collapse did nothing until a refresh. Soft-navigating home can
// also miss the event when the tree module loads afterwards.
//
// This clicks *before* dispatching astro:page-load, then again after, matching
// scripts/verify-filter-build.mjs and scripts/verify-lightbox-build.mjs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'https://bjsmith.xyz/' });
const { window } = dom;
for (const name of ['window', 'document', 'HTMLElement', 'Event', 'localStorage']) {
  Object.defineProperty(globalThis, name, {
    value: window[name], configurable: true, writable: true,
  });
}

const moduleSources = [...document.querySelectorAll('script[type="module"]')]
  .map((script) => script.textContent || '');
const treeController = moduleSources.find((source) => source.includes('data-tree-toggle'));
const themeController = moduleSources.find((source) => source.includes('theme-toggle'));
assert.ok(treeController, 'built homepage tree controller not found');
assert.ok(themeController, 'built footer theme controller not found');

await import(`data:text/javascript;base64,${Buffer.from(treeController).toString('base64')}`);
await import(`data:text/javascript;base64,${Buffer.from(themeController).toString('base64')}`);

const themeToggle = document.getElementById('theme-toggle');
assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
assert.equal(themeToggle?.getAttribute('aria-label'), 'Switch to light mode');

// Cold-load path: modules have run, astro:page-load has not arrived.
themeToggle?.click();
assert.equal(document.documentElement.getAttribute('data-theme'), 'light', 'theme must toggle before astro:page-load');
assert.equal(themeToggle?.getAttribute('aria-label'), 'Switch to dark mode');
themeToggle?.click();
assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');

const branches = [...document.querySelectorAll('[data-tree-toggle]')];
const branchLabels = branches.map((button) => button.querySelector(':scope > span:nth-child(2)')?.textContent?.trim());
assert.deepEqual(branchLabels.slice(0, 5), ['beek/', 'work/', 'dev/', 'art/', 'photos/']);
const photoYearLabels = branchLabels.slice(5);
assert.ok(photoYearLabels.length > 0, 'photos must expose at least one year subsection');
assert.ok(photoYearLabels.every((label) => /^\d{4}\/$/.test(label || '')));
assert.deepEqual(photoYearLabels, [...photoYearLabels].sort().reverse(), 'photo years must be newest first');

function assertToggle(button, label) {
  const panel = document.getElementById(button.getAttribute('aria-controls') || '');
  assert.ok(panel, `${label}: each disclosure must control a tree panel`);
  const initiallyExpanded = button.getAttribute('aria-expanded') === 'true';
  button.click();
  assert.equal(button.getAttribute('aria-expanded'), String(!initiallyExpanded), `${label}: must toggle before/after page-load`);
  assert.equal(panel.dataset.collapsed, String(initiallyExpanded));
  assert.equal(panel.inert, initiallyExpanded);
  button.click();
  assert.equal(button.getAttribute('aria-expanded'), String(initiallyExpanded));
  assert.equal(panel.inert, !initiallyExpanded);
}

for (const button of branches) {
  const expectedExpanded = button.getAttribute('aria-controls') === 'tree-beek';
  assert.equal(button.getAttribute('aria-expanded') === 'true', expectedExpanded, 'only the top-level beek branch must start expanded');
  const panel = document.getElementById(button.getAttribute('aria-controls') || '');
  assert.equal(panel?.dataset.collapsed, String(!expectedExpanded));
  assert.equal(panel?.inert, !expectedExpanded, 'collapsed descendants must leave the tab order');
  assertToggle(button, 'before astro:page-load');
}

// Swap path: re-binding must remain a no-op (dataset guard) and still work.
document.dispatchEvent(new window.Event('astro:page-load'));
themeToggle?.click();
assert.equal(document.documentElement.getAttribute('data-theme'), 'light', 'theme must toggle after astro:page-load');
themeToggle?.click();
assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
for (const button of branches) {
  assertToggle(button, 'after astro:page-load');
}

console.log('homepage tree disclosure guard: ok');
window.close();
