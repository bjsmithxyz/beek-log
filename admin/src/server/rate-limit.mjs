// Best-effort in-memory limiter for warm Netlify function instances. Cold
// starts reset the window; that still bounds sustained abuse within a process.

const windows = new Map();

export function takeRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfterMs: Math.max(1, entry.resetAt - now) };
  }
  return { ok: true, remaining: limit - entry.count };
}

/** Test helper — clear all windows between cases. */
export function resetRateLimits() {
  windows.clear();
}
