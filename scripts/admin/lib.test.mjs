import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossOriginError, validatePreviewPath } from './lib.mjs';

const allowed = ['127.0.0.1:4322', 'localhost:4322'];

test('crossOriginError: same-host request without Origin passes', () => {
  assert.equal(crossOriginError({ host: '127.0.0.1:4322', origin: undefined }, allowed), null);
  assert.equal(crossOriginError({ host: 'localhost:4322', origin: undefined }, allowed), null);
});

test('crossOriginError: same-origin fetch with matching Origin passes', () => {
  assert.equal(crossOriginError({ host: '127.0.0.1:4322', origin: 'http://127.0.0.1:4322' }, allowed), null);
  assert.equal(crossOriginError({ host: 'localhost:4322', origin: 'http://localhost:4322' }, allowed), null);
});

test('crossOriginError: foreign Host is refused', () => {
  assert.ok(crossOriginError({ host: 'evil.example:4322', origin: undefined }, allowed));
  assert.ok(crossOriginError({ host: undefined, origin: undefined }, allowed));
});

test('crossOriginError: foreign Origin is refused', () => {
  assert.ok(crossOriginError({ host: '127.0.0.1:4322', origin: 'https://evil.example' }, allowed));
});

test('crossOriginError: opaque or malformed Origin is refused', () => {
  assert.ok(crossOriginError({ host: '127.0.0.1:4322', origin: 'null' }, allowed));
});

const imageRe = /\.(jpe?g|png|tiff?|webp)$/i;

test('validatePreviewPath accepts an existing image', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => true }), null);
});

test('validatePreviewPath rejects a non-image extension', () => {
  assert.equal(validatePreviewPath('/x/notes.txt', { imageRe, exists: () => true }), 'not an image file');
});

test('validatePreviewPath rejects a missing file', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => false }), 'file not found');
});

test('validatePreviewPath rejects an empty path', () => {
  assert.equal(validatePreviewPath('', { imageRe, exists: () => true }), 'path required');
});
