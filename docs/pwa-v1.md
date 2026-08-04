# PWA v1 architecture

## Offline scope

Version 1 is deliberately read-only offline.

- A successful online load stores one versioned recipe snapshot per user in IndexedDB.
- The snapshot contains recipes, collections, tags, and favorite IDs.
- The service worker caches the visited application shell and recipe images.
- Create, edit, delete, collection management, and favorite mutations always require Supabase to confirm the write.
- Signing out clears IndexedDB and private service-worker caches.

The IndexedDB payload version is `OFFLINE_RECIPE_SCHEMA_VERSION` in
`src/lib/offline-recipes.ts`. Any incompatible recipe-model change must bump
that version and define an explicit migration or invalidate the old snapshot.
Service-worker cache names are versioned independently in `public/sw.js`.

Offline writes are intentionally excluded from v1. Adding them later requires
an operation log, idempotency keys, conflict rules based on `updated_at`, and
recovery for partial synchronization failures.

## Cooking timers

Cooking timers must store an absolute deadline:

```ts
const endsAt = Date.now() + durationMs;
const remainingMs = Math.max(0, endsAt - Date.now());
```

The UI may use an interval only to trigger renders. It must recompute from
`endsAt` after every tick and on `visibilitychange`; it must never decrement a
counter and assume background timers kept running.

Cooking mode should request `navigator.wakeLock.request("screen")` while
visible and release/reacquire it around visibility changes. The completion
sound must be primed by the same user gesture that starts a timer because
mobile browsers block unprompted audio playback.
