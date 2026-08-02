import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, deriveSlug } from './slug.mjs';

test('slugify normalises to kebab', () => {
  assert.equal(slugify('Hong Kong'), 'hong-kong');
  assert.equal(slugify("Côte d'Ivoire"), 'cote-d-ivoire');
});

test('slugify transliterates Cyrillic', () => {
  assert.equal(slugify('Бишкек'), 'bishkek');
  assert.equal(slugify('Алматы'), 'almaty');
  assert.equal(slugify('Київ'), 'kiyiv');
});

test('deriveSlug builds YYYY-MM-stock-place', () => {
  assert.equal(
    deriveSlug({ date: '2026-06-02', stockSlug: 'kodak-portra-400', placeName: 'Lisbon, Portugal' }),
    '2026-06-kodak-portra-400-lisbon',
  );
});

test('deriveSlug transliterates Cyrillic place names', () => {
  assert.equal(
    deriveSlug({ date: '2026-06-02', stockSlug: 'kodak-portra-400', placeName: 'Бишкек, Кыргызстан' }),
    '2026-06-kodak-portra-400-bishkek',
  );
});
