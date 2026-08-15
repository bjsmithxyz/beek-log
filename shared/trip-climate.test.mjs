import { test } from 'node:test';
import assert from 'node:assert/strict';
import { climateExtremes, climateKey, climateNormal } from './trip-climate.mjs';

const BANGKOK_JUNE = { maxC: 32.6, minC: 26.2, rainMm: 4.8, daylightH: 12.9 };
const CACHE = { points: { '13.8,100.5': { 6: BANGKOK_JUNE } } };

const stop = (name, climate) => ({ name, cc: 'XX', month: 'June', climate });

test('the key rounds to the grid the reanalysis actually resolves', () => {
  assert.equal(climateKey(13.7563, 100.5018), '13.8,100.5');
  assert.equal(climateKey(-12.0464, -77.0428), '-12.0,-77.0');
});

test('a stop resolves to the normal for the month its stay began', () => {
  assert.deepEqual(climateNormal(CACHE, 13.7563, 100.5018, 6), BANGKOK_JUNE);
});

test('a point or month the cache has not seen resolves to nothing, never to a guess', () => {
  assert.equal(climateNormal(CACHE, 13.7563, 100.5018, 7), null, 'an unfetched month must not borrow another');
  assert.equal(climateNormal(CACHE, 21.0278, 105.8342, 6), null, 'an unfetched point must not borrow a neighbour');
  assert.equal(climateNormal(null, 13.7563, 100.5018, 6), null, 'a missing cache is not an error');
});

test('a normal is copied field by field, so nothing else in the cache can reach the payload', () => {
  const tampered = { points: { '13.8,100.5': { 6: { ...BANGKOK_JUNE, note: 'left on the 23rd' } } } };
  assert.deepEqual(Object.keys(climateNormal(tampered, 13.7563, 100.5018, 6)).sort(), [
    'daylightH', 'maxC', 'minC', 'rainMm',
  ]);
});

test('a malformed normal is dropped rather than rendered', () => {
  const broken = { points: { '13.8,100.5': { 6: { ...BANGKOK_JUNE, minC: null } } } };
  assert.equal(climateNormal(broken, 13.7563, 100.5018, 6), null);
});

test('the extremes name one published stop per measure', () => {
  const stops = [
    stop('Hot', { maxC: 41, minC: 28, rainMm: 0.1, daylightH: 13.4 }),
    stop('Cold', { maxC: 2, minC: -14, rainMm: 1.2, daylightH: 8.1 }),
    stop('Wet', { maxC: 30, minC: 24, rainMm: 15.3, daylightH: 12.2 }),
    stop('Bright', { maxC: 21, minC: 12, rainMm: 2.4, daylightH: 18.7 }),
  ];
  assert.deepEqual(
    climateExtremes(stops).map(({ label, stop: winner, value }) => [label, winner.name, value]),
    [
      ['warmest', 'Hot', 41],
      ['coldest', 'Cold', -14],
      ['wettest', 'Wet', 15.3],
      ['longest days', 'Bright', 18.7],
    ],
  );
});

test('stops without a normal are ignored, and no normals at all means no block', () => {
  const stops = [stop('Unknown', null), stop('Known', BANGKOK_JUNE)];
  assert.deepEqual(new Set(climateExtremes(stops).map((extreme) => extreme.stop.name)), new Set(['Known']));
  assert.deepEqual(climateExtremes([stop('Unknown', null)]), []);
});
