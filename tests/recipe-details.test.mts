import assert from "node:assert/strict";
import test from "node:test";
import { claimFirstCookHint, getVisibleRecipeDescription } from "../src/lib/recipe-details.ts";
import * as recipeDetails from "../src/lib/recipe-details.ts";

test("description appears only when it adds information beyond the title", () => {
  assert.equal(getVisibleRecipeDescription({ title: "Soup", description: "A gentle winter soup." }), "A gentle winter soup.");
  assert.equal(getVisibleRecipeDescription({ title: "Soup", description: "   " }), null);
  assert.equal(getVisibleRecipeDescription({ title: "Куриный бульон", description: "  куриный   БУЛЬОН  " }), null);
});

test("serving label adds a suffix only to a plain number", () => {
  const format = (recipeDetails as { formatServingsLabel?: (value: string) => string }).formatServingsLabel;
  for (const [input, expected] of [
    ["4", "4 servings"],
    ["4 servings", "4 servings"],
    ["4-6", "4-6"],
    ["Makes 12 cookies", "Makes 12 cookies"],
  ]) {
    assert.equal(format?.(input), expected, input);
  }
});

test("first cook hint is claimed once per user after the first cookable create", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  assert.equal(claimFirstCookHint(storage, "user-a", 0, true, false), true);
  assert.equal(claimFirstCookHint(storage, "user-a", 0, true, false), false);
  assert.equal(claimFirstCookHint(storage, "user-b", 0, true, false), true);
});

test("first cook hint stays unclaimed for edits, later recipes, and recipes without steps", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  assert.equal(claimFirstCookHint(storage, "user-a", 0, true, true), false);
  assert.equal(claimFirstCookHint(storage, "user-a", 1, true, false), false);
  assert.equal(claimFirstCookHint(storage, "user-a", 0, false, false), false);
  assert.equal(values.size, 0);
  assert.equal(claimFirstCookHint(storage, "user-a", 0, true, false), true);
});
