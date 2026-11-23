import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { libraryUrl } from "../extension/shared.js";
import { buildImportedRecipe } from "../src/lib/recipe-import-parser.ts";
import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";
import { createDraftRecipe } from "../src/lib/create-draft-recipe.ts";
import { toSaveRecipeRpcArgs } from "../src/lib/save-recipe-args.ts";

const script = readFileSync(new URL("../extension/library-handoff.js", import.meta.url), "utf8");
const pendingKey = "keep-and-cook:pending-recipe-import";
const recipe = { title: "Панкейки", description: "Завтрак", sourceUrl: "https://art-lunch.ru/recipe/pankejki_foto/", ingredients: [{ id: "milk", name: "молоко - 210 г" }], steps: [{ id: "mix", text: "Перемешать." }] };
function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}

test("production handoff opens existing login and restores the app's pending import before hydration", () => {
  const url = new URL(libraryUrl(recipe));
  assert.equal(url.pathname, "/login");
  const sessionStorage = storage();
  const localStorage = storage();
  let stripped = false;
  runInNewContext(script, { URL, console, setInterval: () => 0, location: url, sessionStorage, localStorage, history: { replaceState() { stripped = true; } } });
  assert.deepEqual(JSON.parse(sessionStorage.getItem(pendingKey)!), recipe);
  assert.equal(sessionStorage.getItem("keep-and-cook:pending-recipe-source"), "extension");
  assert.equal(stripped, true);
  const newTab = storage();
  runInNewContext(script, { URL, console, location: new URL("https://keepandcook.com/dashboard"), sessionStorage: newTab, localStorage });
  assert.deepEqual(JSON.parse(newTab.getItem(pendingKey)!), recipe);
  assert.equal(newTab.getItem("keep-and-cook:pending-recipe-source"), "extension");
  const laterTab = storage();
  runInNewContext(script, { URL, console, location: new URL("https://keepandcook.com/dashboard"), sessionStorage: laterTab, localStorage });
  assert.equal(laterTab.getItem(pendingKey), null);
});

test("old 404 import links are redirected to the compatible login handoff", () => {
  let target = "";
  runInNewContext(script, { URL, console, location: { pathname: "/extension-import", hash: `#${encodeURIComponent(JSON.stringify(recipe))}`, replace(value: string) { target = value; } } });
  assert.match(target, /^\/login#keep-and-cook-import=/);
});

test("unsafe recipes do not become pending imports", () => {
  const sessionStorage = storage();
  runInNewContext(script, { URL, console: { error() {} }, location: new URL(libraryUrl({ ...recipe, sourceUrl: "javascript:alert(1)" })), sessionStorage, localStorage: storage() });
  assert.equal(sessionStorage.getItem(pendingKey), null);
});

test("SPA login clears the recovery after the dashboard consumes the pending recipe", () => {
  const sessionStorage = storage();
  const localStorage = storage();
  const location = { hash: new URL(libraryUrl(recipe)).hash, pathname: "/login", search: "" };
  let watch: (() => void) | undefined;
  runInNewContext(script, { URL, console, location, sessionStorage, localStorage, history: { replaceState() {} }, setInterval(callback: () => void) { watch = callback; return 1; }, clearInterval() {} });
  location.pathname = "/dashboard";
  sessionStorage.removeItem(pendingKey);
  watch?.();
  assert.equal(localStorage.getItem("keep-and-cook:extension-auth-recovery"), null);
});

test("handoff keeps an https photo and drops anything else", () => {
  for (const [imageUrl, expected] of [["https://images.example/p.jpg", "https://images.example/p.jpg"], ["javascript:alert(1)", undefined], ["http://images.example/p.jpg", undefined]] as const) {
    const sessionStorage = storage();
    const location = new URL(`https://keepandcook.com/login#keep-and-cook-import=${encodeURIComponent(JSON.stringify({ ...recipe, imageUrl }))}`);
    runInNewContext(script, { URL, console, setInterval: () => 0, location, sessionStorage, localStorage: storage(), history: { replaceState() {} } });
    assert.equal(JSON.parse(sessionStorage.getItem(pendingKey)!).imageUrl, expected);
  }
});

function handoff(payload: unknown) {
  const sessionStorage = storage();
  const location = new URL(`https://keepandcook.com/login#keep-and-cook-import=${encodeURIComponent(JSON.stringify(payload))}`);
  let strippedTo = "";
  runInNewContext(script, { URL, console: { error() {} }, setInterval: () => 0, location, sessionStorage, localStorage: storage(), history: { replaceState(_s: unknown, _t: string, url: string) { strippedTo = url; } } });
  return { pending: sessionStorage.getItem(pendingKey), error: sessionStorage.getItem("keep-and-cook:pending-recipe-error"), strippedTo };
}

test("a recipe without a description still reaches the editor (launch P0-1)", () => {
  for (const description of ["", undefined]) {
    const { pending, error } = handoff({ ...recipe, description });
    assert.ok(pending, `description ${JSON.stringify(description)} must not drop the recipe`);
    assert.equal(error, null);
  }
});

test("required fields stay required", () => {
  for (const broken of [{ ...recipe, title: " " }, { ...recipe, ingredients: [] }, { ...recipe, steps: [] }, { ...recipe, description: 42 }, { ...recipe, description: "x".repeat(5001) }]) {
    assert.equal(handoff(broken).pending, null);
  }
});

test("a failed transfer leaves an explanation for the page and drops the fragment", () => {
  const { pending, error, strippedTo } = handoff({ ...recipe, title: "" });
  assert.equal(pending, null);
  assert.equal(error, "1");
  assert.equal(strippedTo, "/login");
});

test("server-parsed recipe without a description survives handoff, editor validation and the save RPC", () => {
  const html = `<html><head><title>Plain soup</title><script type="application/ld+json">${JSON.stringify({ "@type": "Recipe", name: "Plain soup", recipeIngredient: ["1 carrot"], recipeInstructions: [{ "@type": "HowToStep", text: "Boil the carrot." }] })}</script></head><body></body></html>`;
  const imported = buildImportedRecipe(html, "https://recipes.example/plain-soup");
  assert.ok(imported);
  assert.equal(imported.description, "");
  const { pending } = handoff(JSON.parse(decodeURIComponent(new URL(libraryUrl(imported)).hash.slice("#keep-and-cook-import=".length))));
  assert.ok(pending);
  const parsed = recipePayloadSchema.parse(createDraftRecipe(JSON.parse(pending), []));
  const args = toSaveRecipeRpcArgs(parsed, "00000000-0000-4000-8000-000000000000");
  assert.equal(args.p_description, null);
  assert.equal(args.p_title, "Plain soup");
  assert.equal(args.p_source_url, "https://recipes.example/plain-soup");
});
