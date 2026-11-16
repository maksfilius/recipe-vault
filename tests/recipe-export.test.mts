import test from "node:test";
import assert from "node:assert/strict";
import { buildRecipeExport } from "../src/lib/recipe-export.ts";

test("JSON export preserves structured data and provides schema.org recipe fields", () => {
  const collections = [{ id: "c1", name: "Favorites", position: 0 }];
  const recipes = [{ id: "r1", title: "Soup", description: "Warm", ingredients: [{ id: "i1", amount: "2", unit: "cups", name: "water" }], steps: [{ id: "s1", text: "Boil." }], collections, tags: ["quick"], sourceUrl: "https://example.com/soup" }];
  const result = buildRecipeExport(recipes, collections, "2026-11-13T00:00:00.000Z");
  assert.deepEqual(result.collections, collections);
  assert.equal(result.recipes[0]["@type"], "Recipe");
  assert.deepEqual(result.recipes[0].recipeIngredient, ["2 cups water"]);
  assert.deepEqual(result.recipes[0].keepAndCook.collectionIds, ["c1"]);
  assert.deepEqual(result.recipes[0].keepAndCook.ingredients, recipes[0].ingredients);
  assert.deepEqual(result.recipes[0].keywords, ["quick"]);
});
