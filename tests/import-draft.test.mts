import test from "node:test";
import assert from "node:assert/strict";
import { clearImportDraft, IMPORT_DRAFT_MAX_AGE_MS, readImportDrafts, writeImportDraft, type ImportDraft } from "../src/lib/import-draft.ts";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

const now = 1_800_000_000_000;
const draft = (id: string, overrides: Partial<ImportDraft> = {}): ImportDraft => ({
  id: `draft-import-${id}`,
  values: {
    title: "Lemon roast chicken",
    ingredients: [{ id: "i1", name: "whole chicken", amount: "1", unit: "kg" }],
    steps: [{ id: "s1", text: "Roast for 60 minutes." }],
    collectionIds: [], tags: [], sourceUrl: "https://site.example/chicken",
  },
  source: "extension", open: true, savedAt: now, ...overrides,
});

test("drafts round-trip per account and never show to another account", () => {
  const storage = memoryStorage();
  assert.equal(writeImportDraft(storage, "user-a", draft("one")), true);
  assert.deepEqual(readImportDrafts(storage, "user-a", now), [draft("one")]);
  assert.deepEqual(readImportDrafts(storage, "user-b", now), []);
  assert.deepEqual(readImportDrafts(storage, "", now), []);
  assert.equal(writeImportDraft(storage, "", draft("two")), false);
});

test("edits replace the same draft and a new import keeps the older one", () => {
  const storage = memoryStorage();
  writeImportDraft(storage, "user-a", draft("one"));
  writeImportDraft(storage, "user-a", draft("two", { savedAt: now + 5 }));
  const edited = draft("one", { savedAt: now + 10, open: false, values: { ...draft("one").values, title: "", sourceUrl: "https://site.exa",
    ingredients: [{ id: "i1", name: "chicken thighs", amount: "800", unit: "g" }], steps: [{ id: "s9", text: "Edited step" }] } });
  writeImportDraft(storage, "user-a", edited);
  const drafts = readImportDrafts(storage, "user-a", now + 10);
  assert.deepEqual(drafts.map((item) => item.id), ["draft-import-one", "draft-import-two"]);
  // Half-typed values (empty title, partial link) survive: only saving validates them.
  assert.deepEqual(drafts[0], edited);
});

test("clearing removes only that draft; the last one removes the key", () => {
  const storage = memoryStorage();
  writeImportDraft(storage, "user-a", draft("one"));
  writeImportDraft(storage, "user-a", draft("two"));
  assert.equal(clearImportDraft(storage, "user-a", "draft-import-one", now), true);
  assert.deepEqual(readImportDrafts(storage, "user-a", now).map((item) => item.id), ["draft-import-two"]);
  clearImportDraft(storage, "user-a", "draft-import-two", now);
  assert.equal(storage.map.size, 0);
});

test("expired, future-dated and malformed drafts are dropped", () => {
  const storage = memoryStorage();
  writeImportDraft(storage, "user-a", draft("old", { savedAt: now - IMPORT_DRAFT_MAX_AGE_MS }));
  writeImportDraft(storage, "user-a", draft("future", { savedAt: now + 60_000 }));
  assert.deepEqual(readImportDrafts(storage, "user-a", now), []);
  storage.setItem("keep-and-cook:import-drafts:user-a", JSON.stringify([{ id: "draft-import-x", values: { title: 5 } }, { id: "evil" }]));
  assert.deepEqual(readImportDrafts(storage, "user-a", now), []);
  storage.setItem("keep-and-cook:import-drafts:user-a", "{not json");
  assert.deepEqual(readImportDrafts(storage, "user-a", now), []);
});

test("storage failures are reported, never treated as success", () => {
  const full = { getItem: () => null, setItem: () => { throw new DOMException("full", "QuotaExceededError"); }, removeItem: () => {} };
  assert.equal(writeImportDraft(full, "user-a", draft("one")), false);
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  assert.equal(writeImportDraft(blocked, "user-a", draft("one")), false);
  assert.deepEqual(readImportDrafts(blocked, "user-a", now), []);
  assert.equal(clearImportDraft(blocked, "user-a", "draft-import-one"), false);
  assert.equal(writeImportDraft(undefined, "user-a", draft("one")), false);
});

test("an edit never brings back a draft saved or discarded in another tab", async () => {
  const { updateImportDraft } = await import("../src/lib/import-draft.ts");
  const storage = memoryStorage();
  writeImportDraft(storage, "user-a", draft("one"));
  const edited = draft("one", { values: { ...draft("one").values, title: "Edited" } });
  assert.equal(updateImportDraft(storage, "user-a", edited), "updated");
  assert.equal(readImportDrafts(storage, "user-a", now)[0].values.title, "Edited");
  clearImportDraft(storage, "user-a", "draft-import-one", now); // saved in the other tab
  assert.equal(updateImportDraft(storage, "user-a", edited), "gone");
  assert.deepEqual(readImportDrafts(storage, "user-a", now), []);
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => {}, removeItem: () => {} };
  assert.equal(updateImportDraft(blocked, "user-a", edited), "failed");
});
