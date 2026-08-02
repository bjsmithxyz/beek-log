import { test } from 'node:test';
import assert from 'node:assert/strict';
import { includePhotoDrafts } from './deploy-context.mjs';

test('photo drafts render in local development and Deploy Previews', () => {
  assert.equal(includePhotoDrafts({ dev: true, context: 'dev' }), true);
  assert.equal(includePhotoDrafts({ dev: false, context: 'deploy-preview' }), true);
});

test('photo drafts stay out of production and branch deploys', () => {
  assert.equal(includePhotoDrafts({ dev: false, context: 'production' }), false);
  assert.equal(includePhotoDrafts({ dev: false, context: 'branch-deploy' }), false);
});
