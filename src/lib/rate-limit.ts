import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Local fallback when no Upstash credentials are configured.

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

type RemoteLimiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number; reason?: string }>;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Shared rate limit is unavailable.");
  }
}

const remoteLimiters = new Map<string, Ratelimit>();

function getRemoteLimiter(limit: number, windowMs: number): RemoteLimiter | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token) return null;
  if (!url || !token) throw new RateLimitUnavailableError();

  const configKey = `${limit}:${windowMs}`;
  let limiter = remoteLimiters.get(configKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
      prefix: `keepandcook:rate-limit:${configKey}`,
      ephemeralCache: false,
      timeout: 2_000,
    });
    remoteLimiters.set(configKey, limiter);
  }
  return limiter;
}

function sweepExpiredEntries(now: number) {
  if (entriesByKey.size <= MAX_TRACKED_KEYS) return;

  for (const [key, entry] of entriesByKey) {
    if (entry.expiresAt <= now) entriesByKey.delete(key);
  }
}

function consumeLocalRateLimit(
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

export function createRateLimitService(resolveRemoteLimiter: (limit: number, windowMs: number) => RemoteLimiter | null) {
  return async (key: string, options: RateLimitOptions): Promise<RateLimitResult> => {
    try {
      const remote = resolveRemoteLimiter(options.limit, options.windowMs);
      if (!remote) return consumeLocalRateLimit(key, options);
      const result = await remote.limit(key);
      if (result.reason === "timeout") throw new RateLimitUnavailableError();
      return {
        allowed: result.success,
        retryAfterSeconds: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - (options.now ?? Date.now())) / 1_000)),
      };
    } catch {
      throw new RateLimitUnavailableError();
    }
  };
}

export const consumeRateLimit = createRateLimitService(getRemoteLimiter);

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
