import test from "node:test";
import assert from "node:assert/strict";
import { selectLibraryRecipes } from "../src/lib/dashboard-library.ts";
import type { Recipe } from "../src/types/recipe.ts";

const recipe = (id: string, overrides: Partial<Recipe> = {}): Recipe => ({
  id, title: id, description: "", ingredients: [], steps: [], collections: [], tags: [],
  createdAt: "2026-01-01T00:00:00Z", ...overrides,
});

test("minimal library search finds titles, ingredient names and tags", () => {
  const recipes = [
    recipe("one", { title: "Tomato soup" }),
    recipe("two", { ingredients: [{ id: "i1", name: "Tomatoes" }] }),
    recipe("three", { tags: ["tomato"] }),
    recipe("four", { title: "Bread" }),
  ];
  assert.deepEqual(selectLibraryRecipes(recipes, "TOMATO").map((item) => item.id), ["one", "two", "three"]);
});

test("minimal library keeps newest recipes first with stable ties", () => {
  const recipes = [
    recipe("older", { createdAt: "2026-01-01T00:00:00Z" }),
    recipe("new-a", { createdAt: "2026-02-01T00:00:00Z" }),
    recipe("new-b", { createdAt: "2026-02-01T00:00:00Z" }),
  ];
  assert.deepEqual(selectLibraryRecipes(recipes, "").map((item) => item.id), ["new-a", "new-b", "older"]);
  assert.deepEqual(recipes.map((item) => item.id), ["older", "new-a", "new-b"]);
});

test("minimal library preserves 200 recipes without filtering", () => {
  const recipes = Array.from({ length: 200 }, (_, index) => recipe(`recipe-${index}`));
  assert.equal(selectLibraryRecipes(recipes, "").length, 200);
});
