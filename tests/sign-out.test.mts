import test from "node:test";
import assert from "node:assert/strict";
import { signOutThisDevice } from "../src/lib/sign-out.ts";

test("sign out ends the session, wipes the offline copy and reports success", async () => {
  const calls: string[] = [];
  const ok = await signOutThisDevice({ signOut: async () => { calls.push("signOut"); return { error: null }; } }, async () => { calls.push("clear"); });
  assert.equal(ok, true);
  assert.deepEqual(calls, ["signOut", "clear"]);
});

test("a failed sign out keeps the offline copy and reports failure", async () => {
  const calls: string[] = [];
  const ok = await signOutThisDevice({ signOut: async () => ({ error: new Error("network") }) }, async () => { calls.push("clear"); });
  assert.equal(ok, false);
  assert.deepEqual(calls, []);
});
