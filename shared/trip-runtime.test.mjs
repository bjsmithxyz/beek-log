import { test } from 'node:test';
import assert from 'node:assert/strict';
import currentTrip from '../src/data/trips.json' with { type: 'json' };
import { computeTrip, daysBetween, haversine, statusOf, todayIso } from './trip-runtime.mjs';

const stop = { name: 'Bangkok', arrive: '2025-06-20', depart: '2025-06-23', lat: 13.7563, lon: 100.5018 };

test('todayIso uses the caller local calendar date', () => {
  assert.equal(todayIso(new Date(2026, 7, 2, 23, 30)), '2026-08-02');
});

test('status is future before arrival, current until departure, then past', () => {
  assert.equal(statusOf(stop, new Date(2025, 5, 19, 12)), 'future');
  assert.equal(statusOf(stop, new Date(2025, 5, 20, 12)), 'current');
  assert.equal(statusOf(stop, new Date(2025, 5, 22, 12)), 'current');
  assert.equal(statusOf(stop, new Date(2025, 5, 23, 0)), 'past');
});

test('computeTrip derives status, stable index and nights from the supplied clock', () => {
  assert.deepEqual(computeTrip([stop], new Date(2025, 5, 21, 12))[0], {
    ...stop, index: 0, status: 'current', nights: 3,
  });
});

test('calendar day differences do not drift across daylight-saving changes', () => {
  assert.equal(daysBetween('2025-03-01', '2025-04-01'), 31);
});

test('haversine returns a plausible Bangkok to Chiang Mai distance', () => {
  const distance = haversine(stop, { lat: 18.7883, lon: 98.9853 });
  assert.ok(distance > 580 && distance < 600);
});

test('the same committed itinerary changes current stop under two clocks', () => {
  const early = computeTrip(currentTrip.stops, new Date(2025, 5, 21, 12));
  const later = computeTrip(currentTrip.stops, new Date(2026, 7, 2, 12));
  assert.equal(early.find((entry) => entry.status === 'current')?.name, 'Bangkok');
  assert.equal(later.find((entry) => entry.status === 'current')?.name, 'Amsterdam');
});
