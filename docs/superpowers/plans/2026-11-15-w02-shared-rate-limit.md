# W-02 Shared Rate Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use one Upstash Redis rate-limit state across server instances when credentials are configured, while retaining the current local-memory behavior without credentials.

**Architecture:** Keep the existing in-memory sliding-window function for local fallback. Make `consumeRateLimit` asynchronous and route configured requests through a cached `@upstash/ratelimit` instance per limit/window pair. Route handlers await the decision and preserve their existing 429 responses.

**Tech Stack:** Next.js route handlers, TypeScript, `@upstash/ratelimit`, `@upstash/redis`, Node test runner.

**Spec:** `docs/tasks.md`, W-02.

## Global Constraints

- Preserve anonymous import 8, signed-in import 30, and image upload 40 requests per 10 minutes.
- Local development without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` uses in-memory counters.
- Never expose Redis credentials through `NEXT_PUBLIC_*` variables.
- Existing rate-limit and route behavior must remain passing.

## Review Focus

- Two instances using the same configured Redis must count against the same key.
- Different limit/window configurations must not share a limiter configuration by accident.
- An incomplete credential pair must not silently disable shared limiting.
- Upstash timeouts must not grant unlimited expensive imports.
- `Retry-After` remains a positive number when blocked.

---

### Task 1: Async limiter and Redis selection

**Files:** `src/lib/rate-limit.ts`, `tests/rate-limit.test.mts`, `package.json`, `package-lock.json`.

- [x] Add failing tests for async in-memory behavior, a configured shared backend, invalid partial credentials, and 429 retry seconds.
- [x] Run the focused tests and observe failures caused by missing Redis behavior.
- [x] Install Upstash dependencies; implement a cached sliding-window limiter for each limit/window pair and keep the in-memory fallback.
- [x] Run focused tests until green.

### Task 2: API routes and docs

**Files:** `src/app/api/recipes/import/route.ts`, `src/app/api/recipes/images/route.ts`, `.env.example`, `README.md`.

- [x] Await the limiter in both routes and return 503 if the configured shared backend cannot decide.
- [x] Document server-only Upstash variables and local fallback; replace the stale in-memory-only limitation.
- [x] Run full `npm run test`, `npm run build`, and `git diff --check`.
