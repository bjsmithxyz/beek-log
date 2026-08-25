// Executes the built travel controller in a DOM runtime to check the timeline.
//
// The timeline groups stops into one disclosure per year, open by default, and
// dates each completed stop exactly. The current stop is dated by "here now"
// instead, so the stay in progress stays open-ended — and carries no trailing
// comma, because the comma belongs to the country/date pair.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import trip from '../src/data/trips.json' with { type: 'json' };
import { publicTrip } from '@beek/shared/trip-public';

const dist = new URL('../dist/', import.meta.url).pathname;
const html = await readFile(`${dist}travel/index.html`, 'utf8');
const dom = new JSDOM(html, { url: 'https://bjsmith.xyz/travel/', pretendToBeVisual: true });
const { window } = dom;
for (const name of ['window', 'document', 'HTMLElement', 'Event', 'localStorage', 'matchMedia', 'requestAnimationFrame', 'MutationObserver', 'AbortController']) {
  Object.defineProperty(globalThis, name, { value: window[name], configurable: true, writable: true });
}

// The travel controller is an external chunk (it bundles Leaflet), so it is
// imported off disk rather than read out of the document.
const chunk = [...document.querySelectorAll('script[type="module"][src]')]
  .map((script) => script.getAttribute('src'))
  .find((src) => src.startsWith('/_assets/') && !src.includes('ClientRouter'));
assert.ok(chunk, 'travel controller chunk not found on the page');

const published = publicTrip(trip);
const expectedYears = [...new Set(published.stops.map((stop) => stop.year))];
assert.ok(expectedYears.length > 0, 'expected the itinerary to publish at least one year');

await import(`${dist}${chunk.replace(/^\//, '')}`);
document.dispatchEvent(new window.Event('astro:page-load'));

const timeline = document.getElementById('travel-timeline');
const groups = [...timeline.querySelectorAll('.timeline-group')];
const toggles = groups.map((group) => group.querySelector('[data-timeline-toggle]'));
assert.deepEqual(
  toggles.map((button) => button?.querySelector('span')?.textContent?.trim()),
  expectedYears,
  'the timeline must open one disclosure per published year, in order',
);

for (const group of groups) {
  const button = group.querySelector('[data-timeline-toggle]');
  const panel = group.querySelector('.timeline-collapse');
  assert.ok(panel, 'each year must control a panel');
  assert.equal(panel.id, button.getAttribute('aria-controls'), 'aria-controls must point at that panel');
  assert.equal(button.getAttribute('aria-expanded'), 'true', 'years must start expanded');
  assert.equal(panel.dataset.collapsed, 'false');

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'false', 'clicking a year must collapse it');
  assert.equal(panel.dataset.collapsed, 'true');
  assert.equal(panel.inert, true, 'a collapsed year must leave the tab order');

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true', 'clicking again must reopen it');
  assert.equal(panel.dataset.collapsed, 'false');
  assert.equal(panel.inert, false);
}

const rows = [...timeline.querySelectorAll('.timeline-row')];
assert.equal(rows.length, published.stops.length, 'every published stop must appear exactly once');

const months = new Set(published.stops.map((stop) => stop.month));
for (const month of months) {
  assert.match(month, /^(January|February|March|April|May|June|July|August|September|October|November|December)$/, 'months must be full names');
}

const past = rows.filter((row) => !row.classList.contains('current'));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const readableDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
};
assert.ok(past.length > 0, 'expected at least one past stop');
for (const [index, row] of rows.entries()) {
  const stop = published.stops[index];
  if (row.classList.contains('current')) continue;
  assert.ok(row.querySelector('.timeline-dates'), 'a past stop must carry exact dates');
  assert.ok(row.querySelector('.timeline-comma'), 'the country must be followed by a comma');
  assert.match(row.textContent, /,\s*\S/, 'the comma must separate country from dates');
  assert.ok(row.textContent.includes(readableDate(stop.arrive)), 'the exact arrival date must be visible');
  assert.ok(row.textContent.includes(readableDate(stop.depart)), 'the exact departure date must be visible');
}

for (const row of rows.filter((row) => row.classList.contains('current'))) {
  assert.ok(row.querySelector('.timeline-here'), 'the current stop must say "here now"');
  assert.equal(row.querySelector('.timeline-month'), null, 'the current stop must not be dated to a month');
  assert.equal(row.querySelector('.timeline-comma'), null, 'the current stop must not trail a comma');
}

console.log(`travel timeline guard: ok (${toggles.length} year(s), ${rows.length} stops)`);
window.close();
