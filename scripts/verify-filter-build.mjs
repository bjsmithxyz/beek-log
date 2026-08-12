// Build-time guard for the directory filter bar.
//
// The filters must answer a click as soon as their module has run. They used to
// bind only on astro:page-load, which the ClientRouter raises from the window
// `load` event — that waits for every subresource, so on a cold load the page
// looked ready while the buttons were still dead. Coming back through a swap
// fired the event immediately and hid the bug.
//
// This executes the built controller in a DOM runtime and clicks *before*
// dispatching astro:page-load, then again after, to prove both paths bind.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url).pathname;

async function checkPage(relativePath, url, rowSelector, filterAttr, filter) {
  const html = await readFile(`${dist}${relativePath}`, 'utf8');
  const dom = new JSDOM(html, { url });
  const { window } = dom;
  for (const name of ['window', 'document', 'HTMLElement', 'Event', 'localStorage']) {
    Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
  }

  // A filter bar is only rendered when there is more than one value to filter
  // by — /photos/ has none while every roll shares a year. Skip rather than
  // fail, so this starts covering the page the moment the bar appears.
  if (!document.querySelector('[data-dir-filters]')) {
    window.close();
    return false;
  }

  const controller = [...document.querySelectorAll('script[type="module"]')]
    .map((script) => script.textContent || '')
    .find((source) => source.includes('data-dir-filters'));
  assert.ok(controller, `${relativePath}: built filter controller not found`);

  const rows = [...document.querySelectorAll(rowSelector)];
  assert.ok(rows.length > 1, `${relativePath}: needs rows to filter`);
  const expected = rows.filter((row) => row.getAttribute(filterAttr) === filter).length;
  assert.ok(expected > 0 && expected < rows.length, `${relativePath}: [${filter}] must be a partial match`);

  const visible = () => rows.filter((row) => row.style.display !== 'none').length;
  const button = (name) => [...document.querySelectorAll('.filter-btn')]
    .find((element) => element.getAttribute('data-filter') === name);

  // Astro emits the same controller source on both directory pages. Give each
  // data URL a distinct fragment so Node does not reuse the first page's cached
  // module when this check installs the second page's document globals.
  await import(`data:text/javascript;base64,${Buffer.from(controller).toString('base64')}#${encodeURIComponent(relativePath)}`);

  // The cold-load path: the module has run, astro:page-load has not arrived.
  button(filter).click();
  assert.equal(visible(), expected, `${relativePath}: [${filter}] must filter before astro:page-load`);
  button('all').click();
  assert.equal(visible(), rows.length, `${relativePath}: [all] must restore before astro:page-load`);

  // The swap path: re-binding must not double-bind or otherwise regress.
  document.dispatchEvent(new window.Event('astro:page-load'));
  button(filter).click();
  assert.equal(visible(), expected, `${relativePath}: [${filter}] must filter after astro:page-load`);
  button('all').click();
  assert.equal(visible(), rows.length, `${relativePath}: [all] must restore after astro:page-load`);

  window.close();
  return true;
}

const checked = [
  await checkPage('work/index.html', 'https://bjsmith.xyz/work/', '.work-row[data-category]', 'data-category', 'dev'),
  await checkPage('photos/index.html', 'https://bjsmith.xyz/photos/', '.roll-row[data-year]', 'data-year', '2025'),
].filter(Boolean).length;

assert.ok(checked > 0, 'no page exercised the filter bar — the guard would be vacuous');
console.log(`directory filter guard: ok (${checked} page(s) with filters)`);
