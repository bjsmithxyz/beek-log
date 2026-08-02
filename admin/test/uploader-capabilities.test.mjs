import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploaderCapabilities } from '../src/lib/uploader-capabilities.mjs';

const complete = {
  matchMedia: () => ({ matches: true }),
  isSecureContext: true,
  showDirectoryPicker() {}, Worker() {}, WebAssembly: {}, createImageBitmap() {},
  OffscreenCanvas() {}, crypto: { randomUUID() {} },
};

test('desktop uploader capability gate requires every image-pipeline primitive', () => {
  assert.equal(uploaderCapabilities(complete).supported, true);
  const missing = uploaderCapabilities({ ...complete, showDirectoryPicker: undefined, OffscreenCanvas: undefined });
  assert.equal(missing.supported, false);
  assert.deepEqual(missing.missing, ['directoryPicker', 'offscreenCanvas']);
});
