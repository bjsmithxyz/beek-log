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
console.log(`travel clock guard: day ${early.day} (${early.current}) -> day ${later.day} (${later.current})`);
window.close();
