import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFolderName, slugify, deriveSlug } from './lib.mjs';

const stocks = { 'kodak-portra-400': {}, 'rollei-rpx-400': {} };

test('parseFolderName: full happy path with multi-token stock + ISO', () => {
  assert.deepEqual(parseFolderName('2026-06-02 - kodak-portra-400-PT', stocks), {
    date: '2026-06-02', stockSlug: 'kodak-portra-400', iso: 'PT', country: 'Portugal',
  });
});

test('parseFolderName: unknown stock leaves stockSlug null but keeps iso/country', () => {
  const r = parseFolderName('2026-06-02 - mystery-stock-JP', stocks);
  assert.equal(r.stockSlug, null);
  assert.equal(r.iso, 'JP');
  assert.equal(r.country, 'Japan');
});

test('parseFolderName: garbled name yields all nulls, never throws', () => {
  assert.deepEqual(parseFolderName('random folder', stocks), {
    date: null, stockSlug: null, iso: null, country: null,
  });
});

test('slugify normalises to kebab', () => {
  assert.equal(slugify('Hong Kong'), 'hong-kong');
  assert.equal(slugify("Côte d'Ivoire"), 'cote-d-ivoire');
});

test('deriveSlug builds YYYY-MM-stock-place', () => {
  assert.equal(
    deriveSlug({ date: '2026-06-02', stockSlug: 'kodak-portra-400', placeName: 'Lisbon, Portugal' }),
    '2026-06-kodak-portra-400-lisbon',
  );
});
