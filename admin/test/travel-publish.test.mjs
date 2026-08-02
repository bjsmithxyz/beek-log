import { test } from 'node:test';
import assert from 'node:assert/strict';
import { travelPublication } from '../src/server/travel-publish.mjs';

const SHA = 'a'.repeat(40);
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const trips = {
  meta: { title: 'Trip', subtitle: 'There and back' },
  stops: [{
    name: 'Bangkok', country: 'Thailand', cc: 'TH', lat: 13.7, lon: 100.5,
    arrive: '2025-01-01', depart: '2025-01-02', note: '', tentative: false,
  }],
};

test('travel request becomes one canonical guarded update operation', () => {
  const result = travelPublication({ requestId, expectedSha: SHA, trips });
  assert.equal(result.operations.length, 1);
  assert.equal(result.operations[0].action, 'update');
  assert.equal(result.operations[0].path, 'src/data/trips.json');
  assert.equal(result.operations[0].expectedSha, SHA);
  assert.equal(result.operations[0].content, JSON.stringify(trips, null, 2));
});

test('travel publication rejects unknown request and stop fields', () => {
  assert.throws(() => travelPublication({ requestId, expectedSha: SHA, trips, path: 'README.md' }), /unknown/);
  assert.throws(() => travelPublication({
    requestId, expectedSha: SHA,
    trips: { ...trips, stops: [{ ...trips.stops[0], arbitrary: true }] },
  }), /unknown/);
});

test('travel publication applies shared validation before publishing', () => {
  assert.throws(() => travelPublication({
    requestId, expectedSha: SHA,
    trips: { ...trips, stops: [{ ...trips.stops[0], lat: 200 }] },
  }), /latitude/);
});
