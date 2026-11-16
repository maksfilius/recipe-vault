import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeRateLimit,
  createRateLimitService,
  getClientAddress,
  resetRateLimits,
} from "../src/lib/rate-limit.ts";

test("allows requests up to the limit and blocks the next one", async () => {
  resetRateLimits();
  const options = { limit: 3, windowMs: 60_000, now: 1_000 };

  assert.equal((await consumeRateLimit("key", options)).allowed, true);
  assert.equal((await consumeRateLimit("key", options)).allowed, true);
  assert.equal((await consumeRateLimit("key", options)).allowed, true);

  const blocked = await consumeRateLimit("key", options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("reports the remaining time until the oldest hit expires", async () => {
  resetRateLimits();

  await consumeRateLimit("key", { limit: 1, windowMs: 10_000, now: 0 });
  const blocked = await consumeRateLimit("key", { limit: 1, windowMs: 10_000, now: 7_500 });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 3);
});

test("slides the window so old hits stop counting", async () => {
  resetRateLimits();
  const window = { limit: 2, windowMs: 1_000 };

  assert.equal((await consumeRateLimit("key", { ...window, now: 0 })).allowed, true);
  assert.equal((await consumeRateLimit("key", { ...window, now: 100 })).allowed, true);
  assert.equal((await consumeRateLimit("key", { ...window, now: 200 })).allowed, false);
  assert.equal((await consumeRateLimit("key", { ...window, now: 1_500 })).allowed, true);
});

test("tracks each key separately", async () => {
  resetRateLimits();
  const options = { limit: 1, windowMs: 60_000, now: 1_000 };

  assert.equal((await consumeRateLimit("import:ip:198.51.100.7", options)).allowed, true);
  assert.equal((await consumeRateLimit("import:ip:198.51.100.7", options)).allowed, false);
  assert.equal((await consumeRateLimit("import:user:abc", options)).allowed, true);
});

test("configured limiter shares the same counter across service instances", async () => {
  type Remote = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };
  const counts = new Map<string, number>();
  const resolve = (limit: number, windowMs: number): Remote => ({
    async limit(key) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { success: count <= limit, reset: 61_000 + windowMs };
    },
  });
  const instanceA = createRateLimitService(resolve);
  const instanceB = createRateLimitService(resolve);
  assert.equal((await instanceA("import:ip:shared", { limit: 2, windowMs: 60_000, now: 1_000 })).allowed, true);
  resetRateLimits();
  assert.equal((await instanceB("import:ip:shared", { limit: 2, windowMs: 60_000, now: 1_000 })).allowed, true);
  resetRateLimits();
  const blocked = await instanceB("import:ip:shared", { limit: 2, windowMs: 60_000, now: 1_000 });
  assert.deepEqual(blocked, { allowed: false, retryAfterSeconds: 120 });
});

test("configured limiter refuses to allow a request after a backend timeout", async () => {
  const service = createRateLimitService(() => ({ limit: async () => ({ success: true, reset: 0, reason: "timeout" }) }));
  await assert.rejects(service("import:ip:shared", { limit: 8, windowMs: 600_000 }), /rate limit.*unavailable/i);
});

test("configured limiter treats invalid backend setup as unavailable", async () => {
  const service = createRateLimitService(() => { throw new Error("invalid Redis URL"); });
  await assert.rejects(service("import:ip:shared", { limit: 8, windowMs: 600_000 }), /rate limit.*unavailable/i);
});

test("one missing Upstash credential does not silently use local memory", async () => {
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await assert.rejects(async () => consumeRateLimit("configured:incomplete", { limit: 1, windowMs: 60_000 }), /rate limit.*unavailable/i);
  } finally {
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  }
});

test("reads the client address from forwarding headers", () => {
  assert.equal(
    getClientAddress(
      new Request("https://example.com", {
        headers: { "x-forwarded-for": "198.51.100.7, 203.0.113.9" },
      }),
    ),
    "198.51.100.7",
  );

  assert.equal(
    getClientAddress(
      new Request("https://example.com", { headers: { "x-real-ip": "198.51.100.8" } }),
    ),
    "198.51.100.8",
  );

  assert.equal(getClientAddress(new Request("https://example.com")), "unknown-client");
});
