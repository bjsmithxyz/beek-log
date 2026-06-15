import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeByName, knownLocations, fillForward } from './loc-utils.mjs';

const hoiAn = { name: 'Hoi An', lat: 15.88, lng: 108.33, region: { name: 'Vietnam', lat: 14, lng: 108 } };
const daNang = { name: 'Da Nang', lat: 16.05, lng: 108.2 };

test('dedupeByName keeps first of each name, case-insensitive, in order', () => {
  const out = dedupeByName([hoiAn, { ...daNang }, { ...hoiAn, name: 'hoi an', lat: 0 }]);
  assert.deepEqual(out.map((l) => l.name), ['Hoi An', 'Da Nang']);
  assert.equal(out[0].lat, 15.88);
});

test('knownLocations gathers roll primary + frame locations, deduped, region kept', () => {
  const frames = [{ location: daNang }, { location: { ...hoiAn } }, {}];
  const out = knownLocations(hoiAn, frames);
  assert.deepEqual(out.map((l) => l.name), ['Hoi An', 'Da Nang']);
  assert.deepEqual(out[0].region, { name: 'Vietnam', lat: 14, lng: 108 });
});

test('fillForward sets the frame + following non-explicit frames, stops at explicit', () => {
  const frames = [
    { location: null, explicit: false },
    { location: null, explicit: false },
    { location: { name: 'set' }, explicit: true },
    { location: null, explicit: false },
  ];
  fillForward(frames, 0, daNang);
  assert.equal(frames[0].location, daNang);
  assert.equal(frames[0].explicit, true);
  assert.equal(frames[1].location, daNang);
  assert.equal(frames[2].location.name, 'set'); // unchanged — was explicit
  assert.equal(frames[3].location, null);       // not reached
});
