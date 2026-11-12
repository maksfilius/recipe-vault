import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRecipeFormValues,
  ingredientsToText,
  ingredientTextToIngredients,
  stepsToText,
  stepTextToSteps,
} from "../src/lib/recipe-form-conversion.ts";
import type { Recipe } from "../src/types/recipe.ts";

test("ingredient lines round-trip without losing quantity, unit or name", () => {
  const ingredients = [
    { id: "1", amount: "1/2", unit: "cup", name: "flour" },
    { id: "2", amount: "2", unit: "кг", name: "картофель" },
    { id: "3", name: "salt", unit: "" },
  ];
  const text = ingredientsToText(ingredients);
  assert.equal(text, "1/2 cup flour\n2 кг картофель\nsalt");
  const parsed = ingredientTextToIngredients("\n" + text + "\n  \n");
  assert.deepEqual(parsed.map(({ amount, unit, name }) => ({ amount, unit, name })), [
    { amount: "1/2", unit: "cup", name: "flour" },
    { amount: "2", unit: "кг", name: "картофель" },
    { amount: undefined, unit: "", name: "salt" },
  ]);
});

test("step text keeps one nonempty line per step", () => {
  const steps = stepTextToSteps("Chop onions.\n\n  Simmer for 10 min.  \n");
  assert.deepEqual(steps.map((step) => step.text), ["Chop onions.", "Simmer for 10 min."]);
  assert.equal(stepsToText(steps), "Chop onions.\nSimmer for 10 min.");
});

test("editing preserves hidden collections, tags and image", () => {
  const recipe: Recipe = {
    id: "recipe", title: "Old title", description: "", ingredients: [], steps: [],
    collections: [{ id: "5b8a9167-6c04-4e5f-8f3e-c4da19e66598", name: "Dinner", position: 0 }],
    tags: ["Quick", "Family"], imageUrl: "https://example.com/photo.webp",
  };
  const values = buildRecipeFormValues({
    title: "New title", ingredientText: "1/2 cup flour", stepText: "",
    sourceUrl: "", totalTime: "", servings: "", description: "", initialValue: recipe,
  });
  assert.deepEqual(values.collectionIds, [recipe.collections[0].id]);
  assert.deepEqual(values.tags, recipe.tags);
  assert.equal(values.imageUrl, recipe.imageUrl);
  assert.equal(values.description, undefined);
});
