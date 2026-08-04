import test from "node:test";
import assert from "node:assert/strict";

import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";

test("accepts a valid https source URL", () => {
  const parsed = recipePayloadSchema.parse({
    title: "Pasta",
    description: "Simple pasta.",
    sourceUrl: "https://example.com/recipe",
    ingredients: [],
    steps: [],
  });

  assert.equal(parsed.sourceUrl, "https://example.com/recipe");
  assert.deepEqual(parsed.collectionIds, []);
  assert.deepEqual(parsed.tags, []);
});

test("rejects non-http source URLs", () => {
  assert.throws(() =>
    recipePayloadSchema.parse({
      title: "Soup",
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

test("normalizes collection ids and free-form tags", () => {
  const collectionId = "5b8a9167-6c04-4e5f-8f3e-c4da19e66598";
  const parsed = recipePayloadSchema.parse({
    title: "Pasta",
    description: "Weeknight pasta.",
    ingredients: [],
    steps: [],
    collectionIds: [collectionId, collectionId],
    tags: [" quick ", "Quick", "vegetarian"],
    imageUrl: "data:image/webp;base64,UklGRg==",
    totalTime: " 30 min ",
    servings: " 4 servings ",
  });

  assert.deepEqual(parsed.collectionIds, [collectionId]);
  assert.deepEqual(parsed.tags, ["quick", "vegetarian"]);
  assert.equal(parsed.totalTime, "30 min");
  assert.equal(parsed.servings, "4 servings");
});
