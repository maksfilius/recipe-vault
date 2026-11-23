// Captures real Keep & Cook screens with the demo cookbook into public/screens/*.webp
// (used by the landing pages and by compose-store-assets.mjs). Needs, all local:
//   1. npx supabase start, then scripts/store/seed-demo-library.mjs
//   2. the app on KC_APP_URL (default http://localhost:3100) pointed at that local Supabase
//   3. python3 -m http.server 8765 --bind 127.0.0.1   (repo root, serves extension/)
//   4. Chrome with --remote-debugging-port=9230 (headless is fine)
// The extension pages run unchanged; only chrome.* APIs are stubbed to hand them the demo recipe.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { connect } from "./cdp.mjs";
import { DEMO_EMAIL, DEMO_PASSWORD, demoRecipes } from "./demo-recipes.mjs";

const app = (process.env.KC_APP_URL || "http://localhost:3100").replace(/\/$/, "");
const statics = (process.env.KC_STATIC_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
const out = new URL("../../public/screens/", import.meta.url);
await mkdir(out, { recursive: true });

const chicken = demoRecipes[0];
const photo = await sharp(await readFile(new URL(`./photos/${chicken.photo}.webp`, import.meta.url))).resize(720).webp({ quality: 72 }).toBuffer();
const recipe = {
  title: chicken.title, description: chicken.description, sourceUrl: chicken.sourceUrl,
  totalTime: chicken.totalTime, servings: chicken.servings, tags: [],
  ingredients: chicken.ingredients, steps: chicken.steps,
  // The panel accepts https or a webp data URL; the website's import preview uses the same form.
  imageUrl: `data:image/webp;base64,${photo.toString("base64")}`,
};
const hideDevOverlay = `try { localStorage.setItem("theme", "light"); } catch {} document.addEventListener("DOMContentLoaded", () => { const style = document.createElement("style"); style.textContent = "nextjs-portal{display:none!important}"; document.head.append(style); });`;

const page = await connect();
async function save(name, clip) {
  const png = await page.png(clip);
  await writeFile(new URL(`${name}.webp`, out), await sharp(png).webp({ quality: 86 }).toBuffer());
  process.stdout.write(`public/screens/${name}.webp\n`);
}

// 1. Side panel reading the recipe tab.
await page.viewport(400, 1040);
await page.beforeLoad(`globalThis.chrome = {
  tabs: { query: async () => [{ id: 7, active: true, url: ${JSON.stringify(recipe.sourceUrl)} }], create: async () => ({}), update: async () => ({}), onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
  scripting: { executeScript: async () => [{ result: ${JSON.stringify(recipe)} }] },
  storage: { session: { set: async () => {} } },
  runtime: { getURL: (path) => "/extension/" + path },
};`);
await page.open(`${statics}/extension/sidepanel.html`, "document.getElementById('panel-state').dataset.state === 'found' && document.getElementById('photo').complete && !document.getElementById('photo').hidden");
await page.evaluate("[...document.querySelectorAll('#ingredients input')].slice(0, 2).forEach((box) => box.click()); true");
await save("extension-panel");

// 2. Cooking view, in the extension's own cooking tab (same reader as the in-page overlay).
await page.viewport(1200, 700, 2, false);
await page.beforeLoad(`{
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) { return attach.call(this, { ...init, mode: "open" }); };
  globalThis.chrome = { storage: { session: { get: async (key) => ({ [key]: ${JSON.stringify(recipe)} }) } }, runtime: { getURL: (path) => "/extension/" + path } };
}`);
await page.open(`${statics}/extension/cooking.html#demo`, "document.querySelector('keep-and-cook-reader')?.shadowRoot?.querySelector('.step-label')?.textContent");
await page.evaluate(`(async () => {
  const root = document.querySelector('keep-and-cook-reader').shadowRoot;
  root.querySelector('nav .primary').click();
  root.querySelector('nav .primary').click();
  await new Promise((resolve) => setTimeout(resolve, 200));
  root.querySelector('.suggestion-buttons button')?.click();
  await new Promise((resolve) => setTimeout(resolve, 1300));
  return root.querySelector('.step-label').textContent;
})()`);
await save("extension-cooking");

// 3. Sign in to the web app as the demo user.
await page.beforeLoad(hideDevOverlay);
await page.viewport(1280, 800, 2, false);
await page.open(`${app}/login`, "document.querySelector('input[type=email]') || location.pathname === '/dashboard'");
if (await page.evaluate("location.pathname === '/login'")) await page.evaluate(`(() => {
  const set = (input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); };
  set(document.querySelector('input[type=email]'), ${JSON.stringify(DEMO_EMAIL)});
  set(document.querySelector('input[type=password]'), ${JSON.stringify(DEMO_PASSWORD)});
  document.querySelector('form button[type=submit]').click();
  return true;
})()`);
await page.waitFor("location.pathname === '/dashboard'", 20000);
const libraryReady = `document.querySelectorAll('main img').length >= 3 && [...document.querySelectorAll('main img')].slice(0, 3).every((img) => img.naturalWidth > 0)`;

// 4. Library on a laptop.
await page.open(`${app}/dashboard`, libraryReady);
await save("library-desktop");

// 5. Review before saving: the draft the extension hands over, in the real editor.
await page.evaluate(`sessionStorage.setItem('keep-and-cook:pending-recipe-import', ${JSON.stringify(JSON.stringify(recipe))}); sessionStorage.setItem('keep-and-cook:pending-recipe-source', 'extension'); true`);
await page.viewport(1280, 1100, 2, false);
await page.open(`${app}/dashboard`, "document.querySelector('[role=dialog]')");
await new Promise((resolve) => setTimeout(resolve, 3600)); // let the "Recipe imported" toast clear
await save("review-desktop");

// 6. Phone: library and a recipe.
await page.viewport(390, 844, 3, true);
await page.open(`${app}/dashboard`, libraryReady.replace(">= 3", ">= 1").replace("slice(0, 3)", "slice(0, 1)"));
await save("library-phone");
await page.evaluate(`(document.querySelector('main a[href*="recipe"], main [role=button], main article button, main button:not([aria-label])') || document.querySelector('main img')).click(); true`);
await page.waitFor("document.body.innerText.includes('Start cooking')");
await new Promise((resolve) => setTimeout(resolve, 600));
await save("recipe-phone");
// 7. The web app's own cooking mode on the phone.
await page.evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Start cooking').click(); true");
await page.waitFor("document.querySelector('[role=dialog]')");
await page.evaluate("[...document.querySelectorAll('[role=dialog] button')].find((button) => /^next/i.test(button.textContent.trim()))?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 900));
await save("cook-phone");

await page.beforeLoad(null);
page.close();
