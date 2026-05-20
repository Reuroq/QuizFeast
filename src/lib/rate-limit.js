/**
 * Tiny in-memory rate limiter (token bucket per key).
 * Resets when the server restarts — fine for spam mitigation on form submissions.
 * Replace with Upstash/Redis if multi-instance.
 */
const buckets = new Map();

export function rateLimit(key, { tokens = 5, refillMs = 60_000 } = {}) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens, last: now };
  const elapsed = now - b.last;
  const refill = (elapsed / refillMs) * tokens;
  b.tokens = Math.min(tokens, b.tokens + refill);
  b.last = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfterMs: Math.ceil((1 - b.tokens) * refillMs / tokens) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true };
}
