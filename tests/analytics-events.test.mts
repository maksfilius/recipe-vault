import test from "node:test";
import assert from "node:assert/strict";
import { getImportSourceKind, minimizeAnalyticsCapture, sanitizeAnalyticsEvent } from "../src/lib/analytics-events.ts";

test("analytics contract keeps only enumerated properties and safe enum values", () => {
  assert.deepEqual(sanitizeAnalyticsEvent("recipe_saved", {
    source: "url", is_first_recipe: true, title: "Private soup", email: "a@example.com",
  }), { source: "url", is_first_recipe: true });
  assert.deepEqual(sanitizeAnalyticsEvent("import_failed", {
    source: "url", reason: "https://secret.example/recipe",
  }), { source: "url" });
  assert.equal(sanitizeAnalyticsEvent("recipe_text", { source: "url" }), null);
});

test("import source kind is classified without sending the URL", () => {
  assert.equal(getImportSourceKind("https://youtu.be/example"), "youtube");
  assert.equal(getImportSourceKind("https://www.instagram.com/reel/example"), "other_video");
  assert.equal(getImportSourceKind("https://example.com/recipe"), "website");
});

test("PostHog transport keeps its project token and identity while stripping automatic URL and private fields", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const event = minimizeAnalyticsCapture({ event: "recipe_saved", uuid: "event-id", properties: {
    token: "untrusted", distinct_id: userId, source: "manual", is_first_recipe: true,
    $current_url: "https://site.example/private?recipe=secret", $set: { email: "secret@example.com" }, title: "Secret soup",
  } }, "phc_project", true);
  assert.deepEqual(event?.properties, { token: "phc_project", distinct_id: userId, source: "manual", is_first_recipe: true, surface: "web", consent_version: 1, is_authenticated: true });
  assert.equal(minimizeAnalyticsCapture({ event: "$pageview", uuid: "event-id", properties: {} }, "phc_project", false), null);
});
