import test from "node:test";
import assert from "node:assert/strict";
import { createDraftRecipe } from "../src/lib/create-draft-recipe.ts";

test("import with a suggested collection remains editable when the account has no collections", () => {
  const draft = createDraftRecipe({ title: "Soup", suggestedCollection: "Dinner", sourceUrl: "https://example.com/soup" }, []);
  assert.equal(draft.title, "Soup");
  assert.equal(draft.suggestedCollection, "Dinner");
  assert.deepEqual(draft.collections, []);
});
