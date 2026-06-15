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

import { aggregatePins } from './locations.ts';

const hoiAn = { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };
const daNang = { name: 'Da Nang', lat: 16.054, lng: 108.202, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };

test('aggregatePins groups by region: one pin at the region with a member breakdown', () => {
  const rolls = [{ id: 'r1', data: { location: hoiAn, photos: [{}, { location: daNang }] } }];
  const pins = aggregatePins(rolls);
  assert.equal(pins.length, 1);
  assert.deepEqual(
    { slug: pins[0].slug, label: pins[0].label, lat: pins[0].lat, lng: pins[0].lng, count: pins[0].count },
    { slug: 'r1', label: 'Vietnam', lat: 14.06, lng: 108.28, count: 2 },
  );
  assert.deepEqual(pins[0].members.sort(), ['Da Nang', 'Hoi An']);
});

test('aggregatePins keeps region-less locations standalone with no members', () => {
  const pins = aggregatePins([{ id: 'r2', data: { location: cn, photos: [{}] } }]);
  assert.deepEqual(pins, [{ slug: 'r2', label: 'Shenzhen, China', lat: 22.5, lng: 114.05, count: 1, members: [] }]);
});

test('aggregatePins sums one region across multiple rolls, slug = first (most recent)', () => {
  const rolls = [
    { id: 'newer', data: { location: hoiAn, photos: [{}] } },
    { id: 'older', data: { location: daNang, photos: [{}, {}] } },
  ];
  const pins = aggregatePins(rolls);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].slug, 'newer');
  assert.equal(pins[0].count, 3);
});
