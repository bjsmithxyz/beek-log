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

test('buildRollMarkdown round-trips a nested region on roll + photo', () => {
  const withRegion = {
    ...roll,
    location: { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } },
    photos: [
      { src: 'x', alt: 'a' },
      { src: 'y', alt: 'b', location: { name: 'Da Nang', lat: 16.054, lng: 108.202, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } } },
    ],
  };
  const { data } = parseRollMarkdown(buildRollMarkdown(withRegion));
  assert.deepEqual(data.location.region, { name: 'Vietnam', lat: 14.06, lng: 108.28 });
  assert.deepEqual(data.photos[1].location.region, { name: 'Vietnam', lat: 14.06, lng: 108.28 });
});

import { rollInputErrors } from './lib.mjs';

const validStocks = { 'kodak-portra-400': {} };
const okBody = {
  slug: '2026-06-kodak-portra-400-lisbon',
  stock: 'kodak-portra-400',
  date: '2026-06-02',
  location: { name: 'Lisbon', lat: 38.72, lng: -9.13 },
  frames: [{ alt: '' }, { alt: 'tram 28' }],
};

test('rollInputErrors: a blank alt is allowed', () => {
  assert.deepEqual(rollInputErrors(okBody, validStocks), []);
});

test('rollInputErrors: still catches an unknown stock', () => {
  const errs = rollInputErrors({ ...okBody, stock: 'nope' }, validStocks);
  assert.ok(errs.some((e) => e.includes('unknown stock')));
});

test('rollInputErrors: still requires a roll location', () => {
  const errs = rollInputErrors({ ...okBody, location: null }, validStocks);
  assert.ok(errs.some((e) => e.includes('roll location')));
});

test('rollInputErrors: still flags a bad per-frame location', () => {
  const errs = rollInputErrors(
    { ...okBody, frames: [{ alt: '', location: { name: '', lat: 1, lng: 2 } }] },
    validStocks,
  );
  assert.ok(errs.some((e) => e.includes('frame 1 location invalid')));
});

import { crossOriginError } from './lib.mjs';

const allowed = ['127.0.0.1:4322', 'localhost:4322'];

test('crossOriginError: same-host request without Origin passes (curl, same-origin GET)', () => {
  assert.equal(crossOriginError({ host: '127.0.0.1:4322', origin: undefined }, allowed), null);
  assert.equal(crossOriginError({ host: 'localhost:4322', origin: undefined }, allowed), null);
});

test('crossOriginError: same-origin fetch with matching Origin passes', () => {
  assert.equal(crossOriginError({ host: '127.0.0.1:4322', origin: 'http://127.0.0.1:4322' }, allowed), null);
  assert.equal(crossOriginError({ host: 'localhost:4322', origin: 'http://localhost:4322' }, allowed), null);
});

test('crossOriginError: foreign Host is refused (DNS rebinding)', () => {
  assert.ok(crossOriginError({ host: 'evil.example:4322', origin: undefined }, allowed));
  assert.ok(crossOriginError({ host: undefined, origin: undefined }, allowed));
});

test('crossOriginError: foreign Origin is refused (CSRF)', () => {
  assert.ok(crossOriginError({ host: '127.0.0.1:4322', origin: 'https://evil.example' }, allowed));
});

test('crossOriginError: opaque/malformed Origin is refused', () => {
  assert.ok(crossOriginError({ host: '127.0.0.1:4322', origin: 'null' }, allowed));
});

import { validatePreviewPath } from './lib.mjs';

const imageRe = /\.(jpe?g|png|tiff?|webp)$/i;

test('validatePreviewPath: accepts an existing image', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => true }), null);
});

test('validatePreviewPath: rejects a non-image extension', () => {
  assert.equal(validatePreviewPath('/x/notes.txt', { imageRe, exists: () => true }), 'not an image file');
});

test('validatePreviewPath: rejects a missing file', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => false }), 'file not found');
});

test('validatePreviewPath: rejects an empty path', () => {
  assert.equal(validatePreviewPath('', { imageRe, exists: () => true }), 'path required');
});
