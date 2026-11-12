import test from "node:test";
import assert from "node:assert/strict";
import { getImportAuthDestination, readRecipeTransfer, removeRecipeTransfer, storeRecipeTransfer } from "../src/lib/recipe-import-transfer.ts";
import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";

const id = "00000000-0000-4000-8000-000000000001";
const recipe = recipePayloadSchema.parse({ title: "Soup", description: "Lunch", ingredients: [{ id: "carrot", name: "Carrot" }], steps: [{ id: "cook", text: "Cook." }] });

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

test("recipe transfer survives another tab and remains until confirmed saving", () => {
  const browserStorage = storage();
  storeRecipeTransfer(browserStorage, id, recipe, 1000);
  assert.deepEqual(readRecipeTransfer({ ...browserStorage }, id, 2000), recipe);
  assert.deepEqual(readRecipeTransfer(browserStorage, id, 3000), recipe);
  removeRecipeTransfer(browserStorage, id);
  assert.throws(() => readRecipeTransfer(browserStorage, id, 4000), /not found/);
});

test("expired drafts are removed and invalid IDs are rejected", () => {
  const browserStorage = storage();
  storeRecipeTransfer(browserStorage, id, recipe, 1000);
  assert.throws(() => readRecipeTransfer(browserStorage, id, 1000 + 8 * 86400000), /expired/);
  assert.throws(() => readRecipeTransfer(browserStorage, id, 2000), /not found/);
  assert.throws(() => storeRecipeTransfer(browserStorage, "../invalid", recipe));
});

test("auth destination retains only a validated recipe draft path", () => {
  assert.equal(getImportAuthDestination(`/dashboard?importDraft=${id}`), `/dashboard?importDraft=${id}`);
  for (const next of [null, "https://evil.example", "//evil.example", "/dashboard?importDraft=bad", "/dashboard/../logout", "/dashboard?next=https://evil.example"]) {
    assert.equal(getImportAuthDestination(next), "/dashboard");
  }
});

test("auth destination preserves safe dashboard routes and library filters", () => {
  assert.equal(getImportAuthDestination("/dashboard/favorites"), "/dashboard");
  assert.equal(getImportAuthDestination("/dashboard/settings"), "/dashboard/settings");
  assert.equal(getImportAuthDestination("/dashboard?q=soup&tags=Quick"), "/dashboard?q=soup&tags=Quick");
  assert.equal(getImportAuthDestination("/dashboard?collections=dinner"), "/dashboard?collections=dinner");
  assert.equal(getImportAuthDestination("/dashboard?add=manual"), "/dashboard?add=manual");
  assert.equal(getImportAuthDestination("/dashboard?add=select"), "/dashboard?add=select");
  assert.equal(getImportAuthDestination("/dashboard?add=automatic"), "/dashboard");
  assert.equal(getImportAuthDestination("/dashboard?next=/login"), "/dashboard");
});
