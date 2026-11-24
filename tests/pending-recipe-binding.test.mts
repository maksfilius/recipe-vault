import test from "node:test";
import assert from "node:assert/strict";
import { bindPendingRecipeToAccount, PENDING_RECIPE_IMPORT_STORAGE_KEY, PENDING_RECIPE_SOURCE_STORAGE_KEY } from "../src/lib/pending-recipe-import.ts";
import { EXTENSION_RECOVERY_STORAGE_KEY, readImportDrafts } from "../src/lib/import-draft.ts";

function memoryStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return { map, getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } };
}
const now = Date.now();
const recipe = {
  title: "Signup chicken", sourceUrl: "https://site.example/signup-chicken", suggestedCollection: "Dinner",
  ingredients: [{ id: "a", name: "whole chicken", amount: "1", unit: "kg" }], steps: [{ id: "s1", text: "Roast for 60 minutes." }],
};
const staged = () => memoryStorage({ [PENDING_RECIPE_IMPORT_STORAGE_KEY]: JSON.stringify(recipe), [PENDING_RECIPE_SOURCE_STORAGE_KEY]: "extension" });

test("sign-up moves the staged recipe into the new account's draft and clears the staged copies", () => {
  const session = staged();
  const local = memoryStorage({ [EXTENSION_RECOVERY_STORAGE_KEY]: JSON.stringify({ recipe, createdAt: now }) });
  assert.deepEqual(bindPendingRecipeToAccount("new-user", { session, local }, now), { kind: "bound", title: "Signup chicken" });
  const [draft] = readImportDrafts(local, "new-user", now);
  assert.equal(draft.open, true);
  assert.equal(draft.source, "extension");
  assert.equal(draft.values.title, "Signup chicken");
  assert.equal(draft.values.suggestedCollection, "Dinner");
  assert.deepEqual(draft.values.steps.map((step) => step.text), ["Roast for 60 minutes."]);
  assert.equal(session.map.size, 0, "staged copy removed: a second tab cannot import it again");
  assert.equal(local.map.has(EXTENSION_RECOVERY_STORAGE_KEY), false);
  assert.deepEqual(readImportDrafts(local, "someone-else", now), [], "bound to the new account only");
});

test("when the draft cannot be stored, the recipe stays staged in this tab", () => {
  const session = staged();
  const full = { getItem: () => null, setItem: () => { throw new DOMException("full", "QuotaExceededError"); }, removeItem: () => {} };
  assert.deepEqual(bindPendingRecipeToAccount("new-user", { session, local: full }, now), { kind: "kept-in-tab", title: "Signup chicken" });
  assert.equal(session.map.has(PENDING_RECIPE_IMPORT_STORAGE_KEY), true);
});

test("nothing staged, an invalid recipe or no user id bind nothing", () => {
  const local = memoryStorage();
  assert.deepEqual(bindPendingRecipeToAccount("new-user", { session: memoryStorage(), local }, now), { kind: "none" });
  assert.deepEqual(bindPendingRecipeToAccount("new-user", { session: memoryStorage({ [PENDING_RECIPE_IMPORT_STORAGE_KEY]: "{bad" }), local }, now), { kind: "none" });
  assert.deepEqual(bindPendingRecipeToAccount("new-user", { session: memoryStorage({ [PENDING_RECIPE_IMPORT_STORAGE_KEY]: JSON.stringify({ title: "" }) }), local }, now), { kind: "none" });
  assert.deepEqual(bindPendingRecipeToAccount("", { session: staged(), local }, now), { kind: "none" });
  assert.equal(local.map.size, 0);
});
