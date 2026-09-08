import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveLocations } from './locations.ts';

const cn = { name: 'Shenzhen, China', lat: 22.5, lng: 114.05 };
const hk = { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 };

test('single roll location → one entry counting all photos', () => {
  const roll = { data: { location: cn, photos: [{}, {}, {}] } };
  assert.deepEqual(effectiveLocations(roll), [{ ...cn, count: 3 }]);
});

test('per-photo overrides produce multiple de-duped entries', () => {
  const roll = { data: { location: cn, photos: [{}, { location: hk }, { location: hk }] } };
  assert.deepEqual(effectiveLocations(roll), [
    { ...cn, count: 1 },
    { ...hk, count: 2 },
  ]);
});

test('de-dup is case-insensitive on name', () => {
  const roll = {
    data: {
      location: cn,
      photos: [{ location: { ...hk, name: 'hong kong' } }, { location: hk }],
    },
  };
  assert.equal(effectiveLocations(roll).length, 1);
  assert.equal(effectiveLocations(roll)[0].count, 2);
});

const viet = { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };

test('region is carried through onto the counted location', () => {
  const roll = { data: { location: viet, photos: [{}, {}] } };
  assert.deepEqual(effectiveLocations(roll), [{ ...viet, count: 2 }]);
});

test('locations without a region gain no region key', () => {
  const roll = { data: { location: cn, photos: [{}] } };
  assert.deepEqual(Object.keys(effectiveLocations(roll)[0]).sort(), ['count', 'lat', 'lng', 'name']);
});
