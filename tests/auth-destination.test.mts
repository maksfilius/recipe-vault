import test from "node:test";
import assert from "node:assert/strict";
import { getImportAuthDestination } from "../src/lib/auth-destination.ts";

test("auth destination keeps a shared link and rejects other sites", () => {
  const shared = `/dashboard?add=select&url=${encodeURIComponent("https://site.example/soup")}`;
  assert.equal(getImportAuthDestination(shared), shared);
  for (const next of [null, "https://evil.example", "//evil.example", "/dashboard?importDraft=00000000-0000-4000-8000-000000000001", "/dashboard/../logout", "/dashboard?next=https://evil.example"]) {
    assert.equal(getImportAuthDestination(next), "/dashboard");
  }
});

test("auth destination preserves safe dashboard routes and library filters", () => {
  assert.equal(getImportAuthDestination("/dashboard/favorites"), "/dashboard");
  assert.equal(getImportAuthDestination("/dashboard/settings"), "/dashboard/settings");
  assert.equal(getImportAuthDestination("/dashboard?q=soup&tags=Quick"), "/dashboard?q=soup&tags=Quick");
  assert.equal(getImportAuthDestination("/dashboard?collections=dinner"), "/dashboard?collections=dinner");
  assert.equal(getImportAuthDestination("/dashboard?add=manual"), "/dashboard?add=manual");
  assert.equal(getImportAuthDestination("/dashboard?add=select"), "/dashboard?add=select");
  assert.equal(getImportAuthDestination("/dashboard?add=automatic"), "/dashboard");
  assert.equal(getImportAuthDestination("/dashboard?next=/login"), "/dashboard");
});
