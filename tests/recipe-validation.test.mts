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

test("accepts textual ingredient quantities", () => {
  const parsed = recipePayloadSchema.parse({
    title: "Pancakes",
    category: "breakfast",
    description: "Simple pancakes.",
    ingredients: [
      {
        id: "ingredient-1",
        name: "flour",
        amount: "1/2",
        unit: "cup",
      },
    ],
    steps: [],
  });

  assert.equal(parsed.ingredients[0]?.amount, "1/2");
});
