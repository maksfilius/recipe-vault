import test from "node:test";
import assert from "node:assert/strict";
import { resolveDashboardIdentity } from "../src/lib/dashboard-auth.ts";

const session = { data: { session: { user: { id: "cached-user" } } } };

test("dashboard uses a verified user while Supabase is reachable", async () => {
  const identity = await resolveDashboardIdentity({
    getSession: async () => session,
    getUser: async () => ({ data: { user: { id: "verified-user" } }, error: null }),
  });
  assert.deepEqual(identity, { userId: "verified-user", offline: false });
});

test("dashboard opens the cached user's snapshot when verification fails offline", async () => {
  const identity = await resolveDashboardIdentity({
    getSession: async () => session,
    getUser: async () => { throw new Error("Network unavailable"); },
  });
  assert.deepEqual(identity, { userId: "cached-user", offline: true });
});

test("dashboard does not wait indefinitely for an unreachable auth server", async () => {
  const identity = await resolveDashboardIdentity({
    getSession: async () => session,
    getUser: () => new Promise(() => {}),
  }, 10);
  assert.deepEqual(identity, { userId: "cached-user", offline: true });
});

test("dashboard does not trust a cached session after a confirmed sign-out", async () => {
  const identity = await resolveDashboardIdentity({
    getSession: async () => session,
    getUser: async () => ({ data: { user: null }, error: null }),
  });
  assert.deepEqual(identity, { userId: null, offline: false });
});
