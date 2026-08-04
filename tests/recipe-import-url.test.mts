import test from "node:test";
import assert from "node:assert/strict";

import {
  assertPublicRecipeUrl,
  isPublicAddress,
  normalizeRecipeImportUrl,
} from "../src/lib/recipe-import-url.ts";

test("normalizes recipe URLs without a protocol", () => {
  assert.equal(
    normalizeRecipeImportUrl("example.com/recipes/soup#ingredients").toString(),
    "https://example.com/recipes/soup",
  );
});

test("rejects unsupported protocols and custom ports", () => {
  assert.throws(() => normalizeRecipeImportUrl("file:///etc/passwd"));
  assert.throws(() => normalizeRecipeImportUrl("https://example.com:8443/recipe"));
});

test("classifies private and public IP addresses", () => {
  assert.equal(isPublicAddress("127.0.0.1"), false);
  assert.equal(isPublicAddress("10.20.30.40"), false);
  assert.equal(isPublicAddress("169.254.169.254"), false);
  assert.equal(isPublicAddress("::1"), false);
  assert.equal(isPublicAddress("::ffff:127.0.0.1"), false);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("blocks local recipe hosts before making a request", async () => {
  await assert.rejects(assertPublicRecipeUrl(new URL("http://localhost/recipe")));
  await assert.rejects(assertPublicRecipeUrl(new URL("http://127.0.0.1/recipe")));
  await assert.rejects(assertPublicRecipeUrl(new URL("http://printer.local/recipe")));
});
