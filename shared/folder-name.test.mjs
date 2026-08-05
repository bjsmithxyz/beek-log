import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFolderName } from './folder-name.mjs';

const stocks = { 'kodak-portra-400': {}, 'rollei-rpx-400': {} };

test('parseFolderName: full happy path with multi-token stock + ISO', () => {
  assert.deepEqual(parseFolderName('2026-06-02 - kodak-portra-400-PT', stocks), {
    date: '2026-06-02', stockSlug: 'kodak-portra-400', iso: 'PT', country: 'Portugal',
  });
});

test('parseFolderName: unknown stock leaves stockSlug null but keeps iso/country', () => {
  const result = parseFolderName('2026-06-02 - mystery-stock-JP', stocks);
  assert.equal(result.stockSlug, null);
  assert.equal(result.iso, 'JP');
  assert.equal(result.country, 'Japan');
});

test('parseFolderName: garbled name yields all nulls, never throws', () => {
  assert.deepEqual(parseFolderName('random folder', stocks), {
    date: null, stockSlug: null, iso: null, country: null,
  });
});

test('parseFolderName: the " - " separator is not required', () => {
  assert.deepEqual(parseFolderName('2026-06-02 kodak-portra-400 PT', stocks), {
    date: '2026-06-02', stockSlug: 'kodak-portra-400', iso: 'PT', country: 'Portugal',
  });
});

test('parseFolderName: the stock is found among surrounding words', () => {
  const result = parseFolderName('2026-06-02 - lisbon roll 3 kodak-portra-400 scans', stocks);
  assert.equal(result.stockSlug, 'kodak-portra-400');
  assert.equal(result.date, '2026-06-02');
});

test('parseFolderName: stock matching ignores case and punctuation', () => {
  assert.equal(parseFolderName('Kodak Portra 400 — 2026-06-02', stocks).stockSlug, 'kodak-portra-400');
});

test('parseFolderName: a date alone is still recovered', () => {
  const result = parseFolderName('scans 2026-06-02', stocks);
  assert.equal(result.date, '2026-06-02');
  assert.equal(result.stockSlug, null);
});

test('parseFolderName: an impossible calendar date is rejected, not passed on', () => {
  assert.equal(parseFolderName('2026-13-45 - kodak-portra-400-PT', stocks).date, null);
});

test('parseFolderName: a country code is only read from the end of the name', () => {
  // "IT" here is a word in the middle, not the shooting country.
  assert.equal(parseFolderName('2026-06-02 - IT was a good roll', stocks).iso, null);
});

test('parseFolderName: the longest matching stock wins over a shorter one', () => {
  const overlapping = { '400': {}, 'kodak-portra-400': {} };
  assert.equal(parseFolderName('2026-06-02 - kodak-portra-400-PT', overlapping).stockSlug, 'kodak-portra-400');
});
