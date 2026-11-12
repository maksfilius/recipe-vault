import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { libraryUrl } from "../extension/shared.js";

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
  assert.equal(stripped, true);
  const newTab = storage();
  runInNewContext(script, { URL, console, location: new URL("https://keepandcook.com/dashboard"), sessionStorage: newTab, localStorage });
  assert.deepEqual(JSON.parse(newTab.getItem(pendingKey)!), recipe);
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
