import assert from "node:assert/strict";
import test from "node:test";
import { buildRecipeFormValues } from "../src/lib/recipe-form-conversion.ts";
import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";
import { toSaveRecipeRpcArgs } from "../src/lib/save-recipe-args.ts";
import type { Recipe } from "../src/types/recipe.ts";

test("editing passes hidden collections, tags and photo to save_recipe", () => {
  const recipe: Recipe = {
    id: "recipe", title: "Soup", description: "Old", ingredients: [], steps: [],
    collections: [{ id: "5b8a9167-6c04-4e5f-8f3e-c4da19e66598", name: "Dinner", position: 0 }],
    tags: ["Family"], imageUrl: "https://example.com/photo.webp",
  };
  const values = buildRecipeFormValues({
    title: "New soup", ingredientText: "", stepText: "", description: "", sourceUrl: "", totalTime: "", servings: "", initialValue: recipe,
  });
  const parsed = recipePayloadSchema.parse(values);
  const args = toSaveRecipeRpcArgs(parsed, recipe.id, recipe.imageUrl);
  assert.deepEqual(args.p_collection_ids, [recipe.collections[0].id]);
  assert.deepEqual(args.p_tags, ["Family"]);
  assert.equal(args.p_image_url, recipe.imageUrl);
  assert.equal(args.p_description, null);
});
