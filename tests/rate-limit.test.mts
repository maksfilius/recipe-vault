import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeRateLimit,
  getClientAddress,
  resetRateLimits,
} from "../src/lib/rate-limit.ts";

test("allows requests up to the limit and blocks the next one", () => {
  resetRateLimits();
  const options = { limit: 3, windowMs: 60_000, now: 1_000 };

  assert.equal(consumeRateLimit("key", options).allowed, true);
  assert.equal(consumeRateLimit("key", options).allowed, true);
  assert.equal(consumeRateLimit("key", options).allowed, true);

  const blocked = consumeRateLimit("key", options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("reports the remaining time until the oldest hit expires", () => {
  resetRateLimits();

  consumeRateLimit("key", { limit: 1, windowMs: 10_000, now: 0 });
  const blocked = consumeRateLimit("key", { limit: 1, windowMs: 10_000, now: 7_500 });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 3);
});

test("slides the window so old hits stop counting", () => {
  resetRateLimits();
  const window = { limit: 2, windowMs: 1_000 };

  assert.equal(consumeRateLimit("key", { ...window, now: 0 }).allowed, true);
  assert.equal(consumeRateLimit("key", { ...window, now: 100 }).allowed, true);
  assert.equal(consumeRateLimit("key", { ...window, now: 200 }).allowed, false);
  assert.equal(consumeRateLimit("key", { ...window, now: 1_500 }).allowed, true);
});

test("tracks each key separately", () => {
  resetRateLimits();
  const options = { limit: 1, windowMs: 60_000, now: 1_000 };

  assert.equal(consumeRateLimit("import:ip:198.51.100.7", options).allowed, true);
  assert.equal(consumeRateLimit("import:ip:198.51.100.7", options).allowed, false);
  assert.equal(consumeRateLimit("import:user:abc", options).allowed, true);
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
