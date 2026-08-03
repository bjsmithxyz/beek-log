// Loads the production HTML and its built travel module under two clocks in a
// DOM runtime. The rendered current stop and day count must change without a
// second build.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url).pathname;
const html = await readFile(join(dist, 'travel/index.html'), 'utf8');
const scriptSrc = [...html.matchAll(/<script type="module" src="([^"]+)"/g)]
  .map((match) => match[1])
  .find((src) => src.includes('index.astro_astro_type_script'));
assert.ok(scriptSrc, 'travel client bundle not found in built HTML');

const dom = new JSDOM(html, {
  url: 'https://bjsmith.xyz/travel/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const { window } = dom;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.HTMLElement.prototype.scrollIntoView = () => {};
if (window.SVGSVGElement) window.SVGSVGElement.prototype.createSVGRect = () => ({});

for (const name of [
  'window', 'document', 'navigator', 'Element', 'HTMLElement', 'SVGElement',
  'MutationObserver', 'AbortController', 'AbortSignal', 'Event', 'CustomEvent',
]) {
  Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.matchMedia = window.matchMedia;
globalThis.fetch = async () => ({ ok: false, status: 503 });

const NativeDate = Date;
function setClock(iso) {
  const fixed = new NativeDate(`${iso}T12:00:00`);
  class FakeDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); }
    static now() { return fixed.getTime(); }
  }
  globalThis.Date = FakeDate;
  window.Date = FakeDate;
}

setClock('2025-06-21');
await import(pathToFileURL(join(dist, scriptSrc)).href);

async function stateAt(iso) {
  setClock(iso);
  document.dispatchEvent(new window.Event('astro:page-load'));
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    day: document.querySelector('#travel-day')?.textContent?.trim(),
    current: document.querySelector('.timeline-row.current strong')?.textContent?.trim(),
  };
}

const early = await stateAt('2025-06-21');
const later = await stateAt('2026-08-02');
assert.match(early.current || '', /Bangkok/);
assert.match(later.current || '', /Amsterdam/);
assert.notEqual(early.day, later.day);
assert.equal(document.querySelector('[data-travel-tab="route"]')?.getAttribute('aria-selected'), 'true');
assert.equal(document.querySelectorAll('[data-travel-panel]:not([hidden])').length, 1);
assert.equal(document.querySelector('[data-travel-panel]:not([hidden])')?.getAttribute('data-travel-panel'), 'route');
assert.ok(document.querySelector('#travel-map.leaflet-container'), 'Leaflet must initialise the route map');
assert.ok(document.querySelectorAll('#travel-map .leaflet-interactive').length > 0, 'route map must render trip geometry');
assert.ok(document.querySelectorAll('#travel-map-stops .map-stop').length > 0, 'route map must expose stop controls');
assert.ok(document.querySelectorAll('#travel-map-stops .map-stop-photos a').length > 0, 'matching stops must link to related photo rolls');
assert.equal(document.querySelector('#travel-more'), null, 'timeline must not have a collapsed-state control');
const timelineDates = [...document.querySelectorAll('#travel-timeline time')]
  .map((element) => element.getAttribute('datetime'));
assert.deepEqual(timelineDates, [...timelineDates].sort().reverse(), 'timeline must be latest first');
for (const name of ['stats', 'timeline', 'route']) {
  document.querySelector(`[data-travel-tab="${name}"]`)?.click();
  await new Promise((resolve) => setTimeout(resolve, name === 'route' ? 50 : 0));
  assert.equal(document.querySelector('[data-travel-tab][aria-selected="true"]')?.getAttribute('data-travel-tab'), name);
  assert.equal(document.querySelector('[data-travel-panel]:not([hidden])')?.getAttribute('data-travel-panel'), name);
}
assert.ok(document.querySelectorAll('#travel-map .leaflet-interactive').length > 0, 'route map must survive tab changes');
console.log(`travel clock guard: day ${early.day} (${early.current}) -> day ${later.day} (${later.current})`);
window.close();
