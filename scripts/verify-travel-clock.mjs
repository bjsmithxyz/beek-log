// Executes the built travel module under two clocks in a DOM runtime.
//
// Before the privacy split this asserted the opposite of what it asserts now:
// that the current stop itself moved with the clock. That only worked because
// every stop's dates were bundled into the client. They are not any more, so
// the published set is fixed at build time and the day counter is the one
// figure that must still move on its own.
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
// Nothing on this page may reach the network any more; fail loudly if it tries.
globalThis.fetch = async () => { throw new Error('the public travel page must not make network requests'); };

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

setClock('2026-08-05');
await import(pathToFileURL(join(dist, scriptSrc)).href);

async function stateAt(iso) {
  setClock(iso);
  document.dispatchEvent(new window.Event('astro:page-load'));
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    day: document.querySelector('#travel-day')?.textContent?.trim(),
    stops: [...document.querySelectorAll('#travel-map-stops .map-stop')].map((node) => node.textContent?.trim()),
    now: document.querySelector('#travel-now')?.textContent?.trim(),
  };
}

const early = await stateAt('2026-08-05');
const later = await stateAt('2026-09-20');

// Live: the day counter is derived in the browser from the one published date.
assert.ok(Number(early.day) > 0, 'day counter must render a real elapsed count');
assert.notEqual(early.day, later.day, 'the day counter must still advance without a rebuild');
assert.equal(Number(later.day) - Number(early.day), 46, 'elapsed days must track the calendar');

// Baked: what is published cannot change in the browser, because the browser
// was never given what it would need to decide.
assert.deepEqual(later.stops, early.stops, 'the published stop list is fixed at build time');
assert.ok(early.stops.length > 0, 'expected published stops to render');
assert.ok(
  document.querySelector('#travel-map-stops .map-stop.planned'),
  'the route tab must render the planned path',
);
assert.equal(later.now, early.now, 'the now/last-seen line is fixed at build time');
assert.match(early.now || '', /^(now|last seen in):/, 'the page must say either where I am or where I was last');

// No date may appear in anything the page renders. The embedded payload is
// excluded here — it legitimately carries the first published arrival, and
// verify-travel-build.mjs is what polices its contents.
const visible = document.querySelector('[data-travel-page]')?.cloneNode(true);
visible?.querySelectorAll('script').forEach((node) => node.remove());
const rendered = visible?.textContent || '';
assert.doesNotMatch(rendered, /\d{4}-\d{2}-\d{2}/, 'no ISO date may be rendered');
assert.equal(document.querySelector('#travel-timeline time'), null, 'timeline rows must not carry dates');
assert.doesNotMatch(rendered, /nights?\b/i, 'stay durations must not be rendered');

// Tab and map behaviour is unchanged by the split.
assert.equal(document.querySelector('[data-travel-tab="route"]')?.getAttribute('aria-selected'), 'true');
assert.equal(document.querySelectorAll('[data-travel-panel]:not([hidden])').length, 1);
assert.equal(document.querySelector('[data-travel-panel]:not([hidden])')?.getAttribute('data-travel-panel'), 'route');
assert.ok(document.querySelector('#travel-map.leaflet-container'), 'Leaflet must initialise the route map');
assert.ok(document.querySelectorAll('#travel-map .leaflet-interactive').length > 0, 'route map must render trip geometry');
assert.ok(document.querySelectorAll('#travel-map-stops .map-stop-photos a').length > 0, 'matching stops must link to related photo rolls');
assert.equal(document.querySelector('#travel-more'), null, 'timeline must not have a collapsed-state control');
assert.equal(document.querySelector('[data-travel-tab="road-ahead"]'), null, 'the road-ahead tab must not exist');

// Weather is back, but baked: this all rendered with a fetch that throws, which
// is the whole difference from the forecasts the road-ahead tab used to pull.
assert.ok(
  document.querySelectorAll('#travel-timeline .timeline-climate').length > 0,
  'published stops must show the typical weather of the month they began',
);
assert.ok(
  document.querySelector('#travel-climate .climate-row'),
  'the stats panel must summarise the route climate',
);

for (const name of ['stats', 'timeline', 'route']) {
  document.querySelector(`[data-travel-tab="${name}"]`)?.click();
  await new Promise((resolve) => setTimeout(resolve, name === 'route' ? 50 : 0));
  assert.equal(document.querySelector('[data-travel-tab][aria-selected="true"]')?.getAttribute('data-travel-tab'), name);
  assert.equal(document.querySelector('[data-travel-panel]:not([hidden])')?.getAttribute('data-travel-panel'), name);
}
assert.ok(document.querySelectorAll('#travel-map .leaflet-interactive').length > 0, 'route map must survive tab changes');
console.log(`travel clock guard: day ${early.day} -> ${later.day}, ${early.stops.length} published stops unchanged`);
window.close();
