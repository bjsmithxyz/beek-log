import { test } from 'node:test';
import assert from 'node:assert/strict';
import currentTrip from '../src/data/trips.json' with { type: 'json' };
import { isPlanned, isPublishable, publicTrip } from './trip-public.mjs';

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

test('a stop that has not begun is planned, tentative or not', () => {
  assert.equal(isPlanned({ status: 'future' }), true);
  assert.equal(isPlanned({ status: 'future', tentative: true }), true);
  assert.equal(isPlanned({ status: 'past' }), false);
  assert.equal(isPlanned({ status: 'current' }), false);
});

test('onward stops leave the visited list and appear only as a dateless plan', () => {
  const { stops, planned } = publicTrip(trip([BANGKOK, HANOI, LIMA]), AT_HANOI);
  assert.deepEqual(stops.map((stop) => stop.name), ['Bangkok', 'Hanoi']);
  assert.deepEqual(planned.map((stop) => stop.name), ['Lima']);
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

test('the climate normal joins the payload keyed on the place and month it already publishes', () => {
  const climate = { points: { '13.8,100.5': { 6: { maxC: 32.6, minC: 26.2, rainMm: 4.8, daylightH: 12.9 } } } };
  const { stops } = publicTrip(trip([BANGKOK, HANOI]), AT_HANOI, climate);
  assert.deepEqual(
    Object.keys(stops[0]).sort(),
    ['cc', 'climate', 'country', 'lat', 'lon', 'month', 'name', 'year'],
    'weather is the only field the normals may add',
  );
  assert.deepEqual(stops[0].climate, { maxC: 32.6, minC: 26.2, rainMm: 4.8, daylightH: 12.9 });
  assert.equal('climate' in stops[1], false, 'a stop the cache has no normal for ships without one');
});

test('the climate normal carries no date, and none of the cache around it', () => {
  const climate = {
    meta: { window: '2015-01-01/2024-12-31' },
    points: { '13.8,100.5': { 6: { maxC: 32.6, minC: 26.2, rainMm: 4.8, daylightH: 12.9 }, 7: { maxC: 33.1, minC: 26.4, rainMm: 5.9, daylightH: 12.8 } } },
  };
  const { stops } = publicTrip(trip([BANGKOK]), AT_HANOI, climate);
  assert.doesNotMatch(JSON.stringify(stops), /\d{4}-\d{2}-\d{2}/, 'the cache window must not ride along');
  assert.doesNotMatch(JSON.stringify(stops), /33\.1/, 'only the month the stay began may ship');
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
  assert.deepEqual(payload.planned.map((stop) => stop.name), ['Lima']);
});

test('a planned stop is a place only — no date, month, note, weather or tentative flag', () => {
  const noted = { ...LIMA, note: 'Maybe January.', tentative: true };
  const climate = { points: { '-12.0,-77.0': { 1: { maxC: 26, minC: 20, rainMm: 0.2, daylightH: 12.6 } } } };
  const { planned } = publicTrip(trip([BANGKOK, noted]), AT_HANOI, climate);
  assert.deepEqual(planned, [{
    name: 'Lima', country: 'Peru', cc: 'PE', lat: -12.0464, lon: -77.0428,
  }]);
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
  assert.deepEqual(payload.planned.map((stop) => stop.name), ['Lima']);
  assert.ok(!payload.stops.some((stop) => stop.name === 'Hanoi'));
  assert.ok(!payload.planned.some((stop) => stop.name === 'Hanoi'));
});

test('a gap between stops leaves no current stop', () => {
  const gap = new Date(2025, 6, 15, 12);
  const payload = publicTrip(trip([BANGKOK, HANOI, LIMA]), gap);
  assert.equal(payload.currentIndex, -1);
  assert.deepEqual(payload.stops.map((stop) => stop.name), ['Bangkok', 'Hanoi']);
});

test('the committed itinerary publishes no future stop as visited under an early clock', () => {
  const payload = publicTrip(currentTrip, new Date(2025, 5, 21, 12));
  assert.equal(payload.stops.length, 1);
  assert.equal(payload.stops[0].name, 'Bangkok');
  assert.ok(payload.planned.length > 0);
  assert.ok(!payload.planned.some((stop) => stop.name === 'Bangkok'));
});

test('the committed itinerary never leaks a date through any stop', () => {
  const payload = publicTrip(currentTrip, new Date(2026, 7, 2, 12));
  assert.ok(payload.stops.length > 1);
  assert.doesNotMatch(
    JSON.stringify(payload.stops),
    /\d{4}-\d{2}-\d{2}/,
    'no ISO date may appear anywhere in the published stop list',
  );
  assert.doesNotMatch(
    JSON.stringify(payload.planned),
    /\d{4}-\d{2}-\d{2}/,
    'no ISO date may appear anywhere in the planned route',
  );
});
