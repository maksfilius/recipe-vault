import assert from "node:assert/strict";
import test from "node:test";

import { prepareRecipeImport, resolveExistingRecipe } from "../src/lib/recipe-import-existing.ts";
import type { RecipeRow } from "../src/lib/recipes.ts";

const sourceUrl = "https://recipes.example/soup";
const savedRow: RecipeRow = {
  id: "saved-recipe", user_id: "user-a", title: "Tomato soup", description: "Warm dinner",
  ingredients: [{ id: "ingredient-1", name: "Tomato" }],
  steps: [{ id: "step-1", text: "Simmer." }],
  image_url: null, source_url: sourceUrl, total_time: null, servings: null,
  tags: [], created_at: "2026-11-16T10:00:00Z", updated_at: null,
};

test("repeat import opens a saved recipe even when it is absent from the dashboard list", async () => {
  const result = await prepareRecipeImport(sourceUrl, async () => savedRow, async () => {
    throw new Error("external recipe import must not run for a saved URL");
  });

  assert.equal(result.kind, "existing");
  assert.equal(result.recipe.id, "saved-recipe");
  assert.equal(result.recipe.title, "Tomato soup");
  assert.equal(result.recipe.steps[0]?.text, "Simmer.");
});

test("new source URL proceeds to external import", async () => {
  const draft = { title: "Fresh soup", ingredients: [], steps: [] };
  const result = await prepareRecipeImport(sourceUrl, async () => null, async (url) => {
    assert.equal(url, sourceUrl);
    return draft;
  });
  assert.deepEqual(result, { kind: "draft", recipe: draft });
});

test("failed duplicate lookup does not start external import", async () => {
  await assert.rejects(prepareRecipeImport(sourceUrl, async () => { throw new Error("database unavailable"); },
    async () => { throw new Error("external import started"); }), /database unavailable/);
});

test("saving an edit with its own source URL is not a duplicate", async () => {
  assert.equal(await resolveExistingRecipe(sourceUrl, "saved-recipe", async () => savedRow), null);
});

test("a unique-key race can recover the saved recipe from its source URL", async () => {
  const recipe = await resolveExistingRecipe(sourceUrl, null, async () => savedRow);
  assert.equal(recipe?.id, "saved-recipe");
  assert.equal(recipe?.sourceUrl, sourceUrl);
});
