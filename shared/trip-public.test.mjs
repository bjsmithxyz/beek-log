import { test } from 'node:test';
import assert from 'node:assert/strict';
import currentTrip from '../src/data/trips.json' with { type: 'json' };
import { isPublishable, publicTrip } from './trip-public.mjs';

const trip = (stops) => ({ meta: { title: 'travel', subtitle: '' }, stops });

const BANGKOK = { name: 'Bangkok', country: 'Thailand', cc: 'TH', lat: 13.7563, lon: 100.5018, arrive: '2025-06-20', depart: '2025-06-23' };
const HANOI = { name: 'Hanoi', country: 'Vietnam', cc: 'VN', lat: 21.0278, lon: 105.8342, arrive: '2025-06-23', depart: '2025-06-30' };
const LIMA = { name: 'Lima', country: 'Peru', cc: 'PE', lat: -12.0464, lon: -77.0428, arrive: '2026-01-05', depart: '2026-01-12' };

const AT_HANOI = new Date(2025, 5, 25, 12);

test('a stop that has not begun is never publishable', () => {
  assert.equal(isPublishable({ status: 'future' }), false);
  assert.equal(isPublishable({ status: 'past' }), true);
  assert.equal(isPublishable({ status: 'current' }), true);
});

test('a tentative stop is withheld even once it has begun', () => {
  assert.equal(isPublishable({ status: 'current', tentative: true }), false);
  assert.equal(isPublishable({ status: 'past', tentative: true }), false);
});

test('onward stops are dropped from the payload entirely, not just hidden', () => {
  const { stops } = publicTrip(trip([BANGKOK, HANOI, LIMA]), AT_HANOI);
  assert.deepEqual(stops.map((stop) => stop.name), ['Bangkok', 'Hanoi']);
});

test('no stop carries a date, a note or a tentative flag into the payload', () => {
  const noted = { ...BANGKOK, note: 'First stop, 3 days in Bangkok.' };
  const { stops } = publicTrip(trip([noted, HANOI]), AT_HANOI);
  for (const stop of stops) {
    assert.deepEqual(
      Object.keys(stop).sort(),
      ['cc', 'country', 'lat', 'lon', 'month', 'name', 'year'],
      'the public stop shape is a closed set — a new field here is a disclosure',
    );
  }
});

test('the year survives so the timeline can head its sections', () => {
  const { stops } = publicTrip(trip([BANGKOK]), AT_HANOI);
  assert.equal(stops[0].year, '2025');
});

test('the month survives as a name, never as a fragment of the arrival date', () => {
  const { stops } = publicTrip(trip([BANGKOK]), AT_HANOI);
  assert.equal(stops[0].month, 'June');
  assert.doesNotMatch(JSON.stringify(stops[0]), /06/, 'the numeric month must not ship');
});

test('every month in the committed itinerary resolves to a name', () => {
  const { stops } = publicTrip(currentTrip, new Date(2026, 7, 2, 12));
  const months = new Set(stops.map((stop) => stop.month));
  assert.ok(months.size > 1);
  for (const month of months) assert.match(month, /^[A-Z][a-z]{2,8}$/);
});

test('start is the first published arrival, so the day counter can run live', () => {
  assert.equal(publicTrip(trip([BANGKOK, HANOI, LIMA]), AT_HANOI).start, '2025-06-20');
});

test('start is withheld while the journey is still ahead, rather than dating it', () => {
  const payload = publicTrip(trip([LIMA]), AT_HANOI);
  assert.equal(payload.start, null);
  assert.deepEqual(payload.stops, []);
});

test('the current stop is marked when it is publishable', () => {
  const payload = publicTrip(trip([BANGKOK, HANOI, LIMA]), AT_HANOI);
  assert.equal(payload.currentIndex, 1);
  assert.equal(payload.stops[payload.currentIndex].name, 'Hanoi');
});

test('a tentative current stop degrades to no current, never to the next stop', () => {
  const payload = publicTrip(trip([BANGKOK, { ...HANOI, tentative: true }, LIMA]), AT_HANOI);
  assert.equal(payload.currentIndex, -1, 'the page must fall back to "last seen in"');
  assert.deepEqual(payload.stops.map((stop) => stop.name), ['Bangkok']);
});

test('a gap between stops leaves no current stop', () => {
  const gap = new Date(2025, 6, 15, 12);
  const payload = publicTrip(trip([BANGKOK, HANOI, LIMA]), gap);
  assert.equal(payload.currentIndex, -1);
  assert.deepEqual(payload.stops.map((stop) => stop.name), ['Bangkok', 'Hanoi']);
});

test('the committed itinerary publishes no future stop under an early clock', () => {
  const payload = publicTrip(currentTrip, new Date(2025, 5, 21, 12));
  assert.equal(payload.stops.length, 1);
  assert.equal(payload.stops[0].name, 'Bangkok');
});

test('the committed itinerary never leaks a date through any stop', () => {
  const payload = publicTrip(currentTrip, new Date(2026, 7, 2, 12));
  assert.ok(payload.stops.length > 1);
  assert.doesNotMatch(
    JSON.stringify(payload.stops),
    /\d{4}-\d{2}-\d{2}/,
    'no ISO date may appear anywhere in the published stop list',
  );
});
