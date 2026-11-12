import test from "node:test";
import assert from "node:assert/strict";
import { getImportReviewWarnings } from "../src/lib/recipe-import-review.ts";

test("import review names missing photo, ingredients and steps without inventing content", () => {
  assert.deepEqual(getImportReviewWarnings({ title: "Soup", description: "Warm soup", imageUrl: undefined, ingredients: [], steps: [] }), [
    "No photo was imported.",
    "No ingredients were imported.",
    "No steps were imported. Add one to use cooking mode.",
  ]);
});

test("import review omits warnings for complete recipes and ignores blank steps", () => {
  assert.deepEqual(getImportReviewWarnings({ title: "Soup", description: "Warm soup", imageUrl: "https://example.com/soup.webp", ingredients: [{ id: "1", name: "tomato" }], steps: [{ id: "2", text: "Cook" }] }), []);
  assert.deepEqual(getImportReviewWarnings({ title: "Soup", description: "Warm soup", imageUrl: "https://example.com/soup.webp", ingredients: [{ id: "1", name: "tomato" }], steps: [{ id: "2", text: " " }] }), ["No steps were imported. Add one to use cooking mode."]);
});

test("missing optional description does not block import review", () => {
  assert.deepEqual(getImportReviewWarnings({ title: "Soup", description: "", imageUrl: "https://example.com/soup.webp", ingredients: [], steps: [] }), [
    "No ingredients were imported.",
    "No steps were imported. Add one to use cooking mode.",
  ]);
});
