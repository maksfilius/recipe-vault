import assert from "node:assert/strict";
import test from "node:test";

import { mapRowToRecipe, type RecipeRow } from "../src/lib/recipes.ts";

test("maps persisted import metadata and collection relations", () => {
  const row: RecipeRow = {
    id: "recipe-1",
    user_id: "user-1",
    title: "Tomato pasta",
    description: "A quick dinner.",
    ingredients: [],
    steps: [],
    image_url: "https://project.supabase.co/storage/v1/object/public/recipe-images/user-1/image.webp",
    source_url: "https://example.com/tomato-pasta",
    total_time: "30 min",
    servings: "4 servings",
    tags: ["quick", "pasta"],
    created_at: "2026-08-04T10:00:00.000Z",
    updated_at: "2026-08-04T11:00:00.000Z",
    recipe_collections: [
      {
        collection: {
          id: "collection-1",
          user_id: "user-1",
          name: "Dinner",
          position: 2,
          created_at: "2026-08-04T09:00:00.000Z",
        },
      },
    ],
  };

  const recipe = mapRowToRecipe(row);

  assert.equal(recipe.imageUrl, row.image_url);
  assert.equal(recipe.totalTime, "30 min");
  assert.equal(recipe.servings, "4 servings");
  assert.deepEqual(recipe.tags, ["quick", "pasta"]);
  assert.deepEqual(recipe.collections.map(({ id, name }) => ({ id, name })), [
    { id: "collection-1", name: "Dinner" },
  ]);
});
