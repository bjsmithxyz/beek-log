import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resetRateLimits, takeRateLimit } from '../src/server/rate-limit.mjs';

test('rate limiter allows a burst then refuses until the window resets', () => {
  resetRateLimits();
  for (let i = 0; i < 3; i += 1) {
    assert.equal(takeRateLimit('demo', { limit: 3, windowMs: 60_000 }).ok, true);
  }
  const blocked = takeRateLimit('demo', { limit: 3, windowMs: 60_000 });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterMs > 0);
});
