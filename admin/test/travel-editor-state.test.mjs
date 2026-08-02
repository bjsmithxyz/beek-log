import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addStop, cloneTrip, moveStop, removeStop, tripSummary, tripsEqual } from '../src/lib/travel-editor-state.mjs';

const source = {
  meta: { title: 'Trip', subtitle: '' },
  stops: [
    { name: 'A', country: 'One', cc: 'ON', lat: 1, lon: 2, arrive: '2025-01-01', depart: '2025-01-02' },
    { name: 'B', country: 'Two', cc: 'TW', lat: 3, lon: 4, arrive: '2025-01-02', depart: '2025-01-03', tentative: true },
  ],
};

test('trip editing clones, reorders and compares without mutating source', () => {
  const draft = cloneTrip(source);
  assert.equal(moveStop(draft, 1, -1), true);
  assert.deepEqual(draft.stops.map((stop) => stop.name), ['B', 'A']);
  assert.deepEqual(source.stops.map((stop) => stop.name), ['A', 'B']);
  assert.equal(tripsEqual(draft, source), false);
  assert.equal(moveStop(draft, 0, -1), false);
});

test('new stops inherit useful location/date defaults and can be removed', () => {
  const draft = cloneTrip(source);
  const index = addStop(draft, 0);
  assert.equal(index, 1);
  assert.deepEqual(draft.stops[1], {
    name: '', country: 'One', cc: 'ON', lat: 1, lon: 2,
    arrive: '2025-01-02', depart: '2025-01-02', note: '', tentative: true,
  });
  assert.equal(removeStop(draft, 1), true);
  assert.equal(draft.stops.length, 2);
  assert.equal(removeStop({ ...draft, stops: [draft.stops[0]] }, 0), false);
});

test('summary reports route bounds and tentative stops', () => {
  assert.deepEqual(tripSummary(source), {
    stops: 2, firstDate: '2025-01-01', lastDate: '2025-01-03', tentative: 1,
  });
});
