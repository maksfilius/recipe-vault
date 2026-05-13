import test from "node:test";
import assert from "node:assert/strict";

import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";

test("accepts a valid https source URL", () => {
  const parsed = recipePayloadSchema.parse({
    title: "Pasta",
    category: "dinner",
    description: "Simple pasta.",
    sourceUrl: "https://example.com/recipe",
    ingredients: [],
    steps: [],
  });

  assert.equal(parsed.sourceUrl, "https://example.com/recipe");
});

test("rejects non-http source URLs", () => {
  assert.throws(() =>
    recipePayloadSchema.parse({
      title: "Soup",
      category: "lunch",
      description: "Hot soup.",
      sourceUrl: "javascript:alert(1)",
      ingredients: [],
      steps: [],
    }),
  );
});
