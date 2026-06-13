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

import { buildRollMarkdown, parseRollMarkdown } from './lib.mjs';

const roll = {
  title: 'lisbon in june',
  stock: 'kodak-portra-400',
  date: '2026-06-02',
  location: { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393 },
  draft: false,
  body: 'shot on a borrowed camera.',
  photos: [
    { src: '../../assets/photos/r/001.jpg', alt: 'tram 28' },
    { src: '../../assets/photos/r/002.jpg', alt: 'alfama', caption: 'dusk' },
    {
      src: '../../assets/photos/r/003.jpg',
      alt: 'border',
      location: { name: 'Badajoz, Spain', lat: 38.8794, lng: -6.9707 },
    },
  ],
};

test('buildRollMarkdown omits per-photo location equal to roll default', () => {
  const md = buildRollMarkdown({
    ...roll,
    photos: [{ src: 'x', alt: 'a', location: { ...roll.location } }],
  });
  const { data } = parseRollMarkdown(md);
  assert.equal(data.photos[0].location, undefined);
});

test('buildRollMarkdown ↔ parseRollMarkdown round-trips overrides and body', () => {
  const md = buildRollMarkdown(roll);
  const { data, body } = parseRollMarkdown(md);
  assert.equal(data.title, 'lisbon in june');
  assert.equal(data.stock, 'kodak-portra-400');
  assert.deepEqual(data.location, roll.location);
  assert.equal(data.photos.length, 3);
  assert.equal(data.photos[0].location, undefined);
  assert.equal(data.photos[1].caption, 'dusk');
  assert.deepEqual(data.photos[2].location, roll.photos[2].location);
  assert.equal(body, 'shot on a borrowed camera.');
});
