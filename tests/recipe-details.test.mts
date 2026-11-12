import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleRecipeDescription } from "../src/lib/recipe-details.ts";

test("description appears only when it adds information beyond the title", () => {
  assert.equal(getVisibleRecipeDescription({ title: "Soup", description: "A gentle winter soup." }), "A gentle winter soup.");
  assert.equal(getVisibleRecipeDescription({ title: "Soup", description: "   " }), null);
  assert.equal(getVisibleRecipeDescription({ title: "Куриный бульон", description: "  куриный   БУЛЬОН  " }), null);
});
