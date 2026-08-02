import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaledDimensions } from '../src/lib/image-dimensions.mjs';

test('image dimensions cap the long edge at 2048 without enlarging', () => {
  assert.deepEqual(scaledDimensions(6000, 4000, 2048), { width: 2048, height: 1365 });
  assert.deepEqual(scaledDimensions(3000, 6000, 2048), { width: 1024, height: 2048 });
  assert.deepEqual(scaledDimensions(1200, 800, 2048), { width: 1200, height: 800 });
  assert.throws(() => scaledDimensions(0, 100, 2048), TypeError);
});
