import assert from "node:assert/strict";
import test from "node:test";
import { findSharedUrl, getSharedLinkKind } from "../src/lib/share-target.ts";

test("share target takes the link from url, then text, then title", () => {
  assert.equal(findSharedUrl({ url: "https://site.example/soup", text: "https://other.example/x" }), "https://site.example/soup");
  assert.equal(findSharedUrl({ title: "Soup", text: "Look at this: https://site.example/soup." }), "https://site.example/soup");
  assert.equal(findSharedUrl({ title: "https://site.example/title" }), "https://site.example/title");
});

test("share target keeps the first of several links", () => {
  assert.equal(findSharedUrl({ text: "https://a.example/1 and https://b.example/2" }), "https://a.example/1");
});

test("share target finds no link in plain text or unsafe schemes", () => {
  assert.equal(findSharedUrl({ title: "Soup", text: "no link here" }), null);
  assert.equal(findSharedUrl({}), null);
  assert.equal(findSharedUrl({ url: "javascript:alert(1)" }), null);
  assert.equal(findSharedUrl({ url: "data:text/html,https://x" }), null);
});

test("share target sorts links into sites and video platforms", () => {
  assert.equal(getSharedLinkKind("https://www.allrecipes.com/recipe/1"), "site");
  assert.equal(getSharedLinkKind("https://youtu.be/abc"), "youtube");
  assert.equal(getSharedLinkKind("https://m.youtube.com/watch?v=abc"), "youtube");
  assert.equal(getSharedLinkKind("https://vm.tiktok.com/abc"), "tiktok");
  assert.equal(getSharedLinkKind("https://www.instagram.com/reel/abc"), "instagram");
});
