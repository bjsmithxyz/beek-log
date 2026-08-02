import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRollMarkdown, parseRollMarkdown, rollInputErrors } from './roll-markdown.mjs';

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
  const markdown = buildRollMarkdown({
    ...roll,
    photos: [{ src: 'x', alt: 'a', location: { ...roll.location } }],
  });
  assert.equal(parseRollMarkdown(markdown).data.photos[0].location, undefined);
});

test('buildRollMarkdown and parseRollMarkdown round-trip overrides and body', () => {
  const { data, body } = parseRollMarkdown(buildRollMarkdown(roll));
  assert.equal(data.title, 'lisbon in june');
  assert.equal(data.stock, 'kodak-portra-400');
  assert.deepEqual(data.location, roll.location);
  assert.equal(data.photos.length, 3);
  assert.equal(data.photos[0].location, undefined);
  assert.equal(data.photos[1].caption, 'dusk');
  assert.deepEqual(data.photos[2].location, roll.photos[2].location);
  assert.equal(body, 'shot on a borrowed camera.');
});

test('buildRollMarkdown round-trips a nested region on roll and photo', () => {
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

const validStocks = { 'kodak-portra-400': {} };
const validBody = {
  slug: '2026-06-kodak-portra-400-lisbon',
  stock: 'kodak-portra-400',
  date: '2026-06-02',
  location: { name: 'Lisbon', lat: 38.72, lng: -9.13 },
  frames: [{ alt: '' }, { alt: 'tram 28' }],
};

test('rollInputErrors allows a blank alt', () => {
  assert.deepEqual(rollInputErrors(validBody, validStocks), []);
});

test('rollInputErrors catches unknown stock, missing location and bad frame location', () => {
  assert.ok(rollInputErrors({ ...validBody, stock: 'nope' }, validStocks).some((error) => error.includes('unknown stock')));
  assert.ok(rollInputErrors({ ...validBody, location: null }, validStocks).some((error) => error.includes('roll location')));
  const errors = rollInputErrors({
    ...validBody,
    frames: [{ alt: '', location: { name: '', lat: 1, lng: 2 } }],
  }, validStocks);
  assert.ok(errors.some((error) => error.includes('frame 1 location invalid')));
});
