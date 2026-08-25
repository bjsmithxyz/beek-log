// Build-time guard for the public travel page.
//
// The contract this enforces changed with the privacy split. It used to be
// "status must never be prerendered, the browser fills it in" — which only
// worked because the whole of trips.json was bundled into the client. That
// bundle published every exact date, note and tentative flag to anyone who
// opened it.
//
// The contract is now the inverse: the build decides what may be published and
// nothing else is allowed to reach the browser. Status is therefore baked.
// Visited places and completed dates may ship; live/future dates, notes and
// tentative-already-begun stops must not. See shared/trip-public.mjs.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import trip from '../src/data/trips.json' with { type: 'json' };
import { publicTrip } from '@beek/shared/trip-public';
import { computeTrip } from '@beek/shared/trip-runtime';

const dist = new URL('../dist/', import.meta.url).pathname;
const html = await readFile(join(dist, 'travel/index.html'), 'utf8');

assert.match(html, /<h1[^>]*class="page-title"[^>]*>travel\/<\/h1>/, 'travel must name itself as a directory, like work\/ and photos\/');
assert.doesNotMatch(html, /Long Way Round/, 'retired travel title must not ship');
assert.match(html, /role="tablist"[^>]*aria-label="Travel sections"/, 'travel section tabs must be built');
assert.doesNotMatch(html, /data-travel-panel="timeline"[^>]*>\s*<div class="travel-section-head"/, 'timeline panel must not repeat the tab label');
assert.doesNotMatch(html, /The whole journey, latest date first/, 'timeline panel must not describe the retired ordering');
assert.doesNotMatch(html, /Trip started|Weather via Open-Meteo/, 'legacy travel footer must be removed');
assert.doesNotMatch(html, /edit trip|save to github/i, 'public travel page must not contain editor UI');

// The map legend is retired: two colours with no key beat a key nobody reads.
assert.doesNotMatch(html, /travel-map-legend|legend-dot|been there/, 'the retired map legend must not ship');

// The forward-looking tab is gone from the public surface entirely.
assert.doesNotMatch(html, /road-ahead/, 'the road-ahead tab must not exist on the public page');
assert.deepEqual(
  [...html.matchAll(/data-travel-tab="([^"]+)"/g)].map(([, name]) => name),
  ['stats', 'route', 'timeline'],
  'the public page publishes exactly three tabs',
);

// --- The privacy contract -------------------------------------------------
// Nothing the build withheld may appear anywhere in the shipped site: not in
// the page, not in a JS chunk, not in the embedded payload. Planned places
// are published on purpose; live/future dates and tentative-already-begun stops are not.
const published = publicTrip(trip);
const computed = computeTrip(trip.stops);
const publicDates = new Set([
  published.start,
  ...computed
    .filter((stop) => stop.status === 'past' && stop.tentative !== true)
    .flatMap((stop) => [stop.arrive, stop.depart]),
].filter(Boolean));
const publishedNames = new Set([
  ...published.stops.map((stop) => stop.name),
  ...published.planned.map((stop) => stop.name),
]);
const withheld = trip.stops.filter((stop) => !publishedNames.has(stop.name));

// The embedded payload is the single channel through which the itinerary
// reaches a browser, so its shape is policed field by field rather than only
// scanned for known secrets. `climate` is the one addition the split allows: a
// long-run normal for a place and month the payload already carries, joined in
// at build time from src/data/climate.json so nothing has to be fetched live.
const embedded = html.match(/<script id="travel-data"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(embedded, 'the travel payload must be embedded in the page');
const payload = JSON.parse(embedded[1].replace(/\\u003c/g, '<'));

const PUBLISHABLE_FIELDS = new Set(['name', 'country', 'cc', 'lat', 'lon', 'year', 'month', 'arrive', 'depart', 'climate']);
const PLANNED_FIELDS = new Set(['name', 'country', 'cc', 'lat', 'lon']);
const CLIMATE_FIELDS = new Set(['maxC', 'minC', 'rainMm', 'daylightH']);
assert.ok(Array.isArray(payload.planned), 'the planned route must ship as its own array');
for (const stop of payload.stops) {
  for (const field of Object.keys(stop)) {
    assert.ok(PUBLISHABLE_FIELDS.has(field), `the embedded payload carries "${field}", which the public stop shape does not allow`);
  }
  const source = computed.find((entry) => entry.name === stop.name);
  const mayCarryExactDates = source?.status === 'past' && source.tentative !== true;
  assert.equal('arrive' in stop, mayCarryExactDates, `${stop.name} must only carry dates after a completed stay`);
  assert.equal('depart' in stop, mayCarryExactDates, `${stop.name} must only carry departure after a completed stay`);
  for (const field of Object.keys(stop.climate ?? {})) {
    assert.ok(CLIMATE_FIELDS.has(field), `the embedded climate normal carries "${field}" — normals publish four figures, nothing else`);
  }
}
for (const stop of payload.planned) {
  for (const field of Object.keys(stop)) {
    assert.ok(PLANNED_FIELDS.has(field), `a planned stop carries "${field}", which would date or qualify the route ahead`);
  }
}

// Missing normals are not a failure: a stop published by the nightly rebuild
// before anyone regenerated the cache simply renders without weather.
const missingClimate = payload.stops.filter((stop) => !stop.climate).length;
if (missingClimate) {
  console.warn(`travel climate: ${missingClimate} of ${payload.stops.length} published stop(s) have no normal — run \`npm run climate\``);
}

// Scope: the travel page itself plus every shipped script. Those are the only
// surfaces the itinerary can reach. Scanning the whole site instead would trip
// over legitimate content — photo rolls carry ISO dates, and a withheld city is
// often somewhere already photographed.
async function* scripts(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* scripts(path);
    else if (entry.name.endsWith('.js')) yield path;
  }
}

async function* surfaces() {
  yield join(dist, 'travel/index.html');
  yield* scripts(dist);
}

for await (const path of surfaces()) {
  const contents = await readFile(path, 'utf8');
  const relative = path.slice(dist.length);

  for (const stop of withheld) {
    assert.ok(
      !contents.includes(stop.name),
      `${relative} leaks the withheld stop "${stop.name}" — tentative stops that have already begun must not ship`,
    );
  }

  // Completed non-tentative dates are intentionally public. Every other
  // itinerary date remains private, apart from the first published arrival
  // which the live day counter needs and which N-plus-today already discloses.
  for (const stop of trip.stops) {
    for (const date of [stop.arrive, stop.depart]) {
      if (publicDates.has(date)) continue;
      assert.ok(
        !contents.includes(date),
        `${relative} leaks the live/future itinerary date ${date}`,
      );
    }
  }
}

console.log(`travel privacy guard: ok (${published.stops.length} published, ${published.planned.length} planned, ${withheld.length} withheld, ${payload.stops.length - missingClimate} with climate)`);
