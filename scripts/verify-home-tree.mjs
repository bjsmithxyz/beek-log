// Executes the built homepage disclosure controller in a DOM runtime.
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
document.dispatchEvent(new window.Event('astro:page-load'));

const themeToggle = document.getElementById('theme-toggle');
assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
assert.equal(themeToggle?.getAttribute('aria-label'), 'Switch to light mode');
themeToggle?.click();
assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
assert.equal(themeToggle?.getAttribute('aria-label'), 'Switch to dark mode');

const branches = [...document.querySelectorAll('[data-tree-toggle]')];
assert.equal(branches.length, 3, 'beek, work, and photos must be collapsible');
for (const button of branches) {
  const panel = document.getElementById(button.getAttribute('aria-controls') || '');
  assert.ok(panel, 'each disclosure must control a tree panel');
  const initiallyExpanded = button.getAttribute('aria-expanded') === 'true';
  const expectedExpanded = button.getAttribute('aria-controls') === 'tree-beek';
  assert.equal(initiallyExpanded, expectedExpanded, 'only the top-level beek branch must start expanded');
  assert.equal(panel.dataset.collapsed, String(!expectedExpanded));
  assert.equal(panel.inert, !expectedExpanded, 'collapsed descendants must leave the tab order');

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), String(!initiallyExpanded));
  assert.equal(panel.dataset.collapsed, String(initiallyExpanded));
  assert.equal(panel.inert, initiallyExpanded);

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), String(initiallyExpanded));
  assert.equal(panel.inert, !initiallyExpanded);
}

console.log('homepage tree disclosure guard: ok');
window.close();
