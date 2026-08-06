// In-memory sliding-window limiter. It bounds abuse per serverless instance,
// which is the cheap first line of defence; a shared store is still required
// before the public demo carries real traffic across many instances.

const MAX_TRACKED_KEYS = 20_000;

type RateLimitEntry = {
  timestamps: number[];
  expiresAt: number;
};

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const entriesByKey = new Map<string, RateLimitEntry>();

function sweepExpiredEntries(now: number) {
  if (entriesByKey.size <= MAX_TRACKED_KEYS) return;

  for (const [key, entry] of entriesByKey) {
    if (entry.expiresAt <= now) entriesByKey.delete(key);
  }
}

export function consumeRateLimit(
  key: string,
  { limit, windowMs, now = Date.now() }: RateLimitOptions,
): RateLimitResult {
  sweepExpiredEntries(now);

  const windowStart = now - windowMs;
  const timestamps = (entriesByKey.get(key)?.timestamps ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );

  if (timestamps.length >= limit) {
    const oldestHit = timestamps[0] ?? now;
    entriesByKey.set(key, { timestamps, expiresAt: oldestHit + windowMs });
    const retryAfterMs = oldestHit + windowMs - now;

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1_000)),
    };
  }

  timestamps.push(now);
  entriesByKey.set(key, { timestamps, expiresAt: now + windowMs });

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits() {
  entriesByKey.clear();
}

// Vercel replaces `x-forwarded-for` with the real client chain, so the first
// entry is the caller rather than a value the caller controls.
export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",", 1)[0]?.trim();
  if (firstForwarded) return firstForwarded;

  return request.headers.get("x-real-ip")?.trim() || "unknown-client";
}
