import { test } from 'node:test';
import assert from 'node:assert/strict';
import currentTrip from '../src/data/trips.json' with { type: 'json' };
import {
  computeTrip, daysBetween, flagOf, haversine, isoDate, monthsWeeksBetween, statusOf,
} from './trip-runtime.mjs';

const stop = { name: 'Bangkok', arrive: '2025-06-20', depart: '2025-06-23', lat: 13.7563, lon: 100.5018 };

test('isoDate uses the caller local calendar date', () => {
  assert.equal(isoDate(new Date(2026, 7, 2, 23, 30)), '2026-08-02');
});

test('isoDate formats an arbitrary date, not only today', () => {
  assert.equal(isoDate(new Date(2024, 0, 5)), '2024-01-05');
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

test('flagOf renders a country code as a regional-indicator flag emoji', () => {
  assert.equal(flagOf('TH'), '🇹🇭');
  assert.equal(flagOf('th'), '🇹🇭');
});

test('flagOf returns nothing for a missing or malformed code', () => {
  assert.equal(flagOf(''), '');
  assert.equal(flagOf(undefined), '');
});

test('monthsWeeksBetween counts whole calendar months, then whole remaining weeks', () => {
  assert.deepEqual(monthsWeeksBetween('2025-06-20', '2025-06-20'), { months: 0, weeks: 0 });
  assert.deepEqual(monthsWeeksBetween('2025-06-20', '2025-06-27'), { months: 0, weeks: 1 });
  assert.deepEqual(monthsWeeksBetween('2025-06-20', '2025-08-20'), { months: 2, weeks: 0 });
  assert.deepEqual(monthsWeeksBetween('2025-06-20', '2025-08-25'), { months: 2, weeks: 0 });
  assert.deepEqual(monthsWeeksBetween('2025-06-20', '2025-09-03'), { months: 2, weeks: 2 });
});

test('monthsWeeksBetween does not overshoot when the start day does not exist in the anchor month', () => {
  assert.deepEqual(monthsWeeksBetween('2025-01-31', '2025-03-02'), { months: 1, weeks: 0 });
});
