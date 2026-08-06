// Build-time guard for the photo/work lightbox.
//
// Frames must answer a click as soon as their module has run. They used to
// bind only on astro:page-load, which the ClientRouter raises from the window
// `load` event — that waits for every thumbnail, so on a cold roll page the
// contact sheet looked ready while clicks did nothing. Soft-navigating into a
// roll could also miss the event when the lightbox module loaded afterwards.
//
// This executes the built controller in a DOM runtime and clicks *before*
// dispatching astro:page-load, then again after, to prove both paths bind.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url).pathname;

async function findRollPage() {
  const entries = await readdir(`${dist}photos`, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const relativePath = `photos/${entry.name}/index.html`;
    const html = await readFile(`${dist}${relativePath}`, 'utf8');
    if (html.includes('id="lightbox"') && html.includes('data-lightbox')) {
      return { relativePath, html, url: `https://bjsmith.xyz/photos/${entry.name}/` };
    }
  }
  throw new Error('no built roll page with a lightbox found');
}

const { relativePath, html, url } = await findRollPage();
const dom = new JSDOM(html, { url, pretendToBeVisual: true });
const { window } = dom;
for (const name of [
  'window', 'document', 'HTMLElement', 'Event', 'KeyboardEvent', 'MouseEvent',
  'localStorage', 'history', 'location', 'AbortController', 'AbortSignal',
]) {
  Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
}

const controller = [...document.querySelectorAll('script[type="module"]')]
  .map((script) => script.textContent || '')
  .find((source) => source.includes('setupLightbox') || source.includes('data-lightbox'));
assert.ok(controller, `${relativePath}: built lightbox controller not found`);

const frames = [...document.querySelectorAll('[data-lightbox]')];
assert.ok(frames.length > 0, `${relativePath}: needs lightbox frames`);
const lightbox = document.getElementById('lightbox');
assert.ok(lightbox, `${relativePath}: missing #lightbox`);

await import(`data:text/javascript;base64,${Buffer.from(controller).toString('base64')}`);

const isOpen = () => lightbox.classList.contains('active');

// The cold-load path: the module has run, astro:page-load has not arrived.
frames[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
assert.equal(isOpen(), true, `${relativePath}: frame click must open before astro:page-load`);
document.querySelector('.lightbox-close').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
// history.back() is async in some environments; force-closed state for the next check
lightbox.classList.remove('active');

// The swap path: re-binding must still open without stacking a dead controller.
document.dispatchEvent(new window.Event('astro:page-load'));
const mid = frames[Math.min(1, frames.length - 1)];
mid.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
assert.equal(isOpen(), true, `${relativePath}: frame click must open after astro:page-load`);

window.close();
console.log(`lightbox guard: ok (${relativePath}, ${frames.length} frames)`);
