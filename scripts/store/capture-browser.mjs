// Captures the extension in a desktop Chrome window: browser.html draws the window around the recipe
// blog (host-page.html) and the real side panel, which runs unchanged with chrome.* stubbed to hand it
// the demo recipe. Writes public/screens/extension-browser.webp (2560×1600).
//   python3 -m http.server 8765 --bind 127.0.0.1   (repo root), Chrome on KC_CDP_PORT, then
//   node scripts/store/capture-browser.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { connect } from "./cdp.mjs";
import { demoRecipes } from "./demo-recipes.mjs";

const statics = (process.env.KC_STATIC_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
const chicken = demoRecipes[0];
const photo = await sharp(await readFile(new URL(`./photos/${chicken.photo}.webp`, import.meta.url))).resize(720).webp({ quality: 72 }).toBuffer();
// The panel's source link matches the address bar of the blog page beside it.
const sourceUrl = "https://sundaysuppers.example/lemon-herb-roast-chicken";
const recipe = {
  title: chicken.title, description: chicken.description, sourceUrl,
  totalTime: chicken.totalTime, servings: chicken.servings, tags: [],
  ingredients: chicken.ingredients, steps: chicken.steps,
  imageUrl: `data:image/webp;base64,${photo.toString("base64")}`,
};

const page = await connect();
await page.viewport(1280, 800, 2, false);
// Runs in every frame; only the side panel uses it.
await page.beforeLoad(`globalThis.chrome = {
  tabs: { query: async () => [{ id: 7, active: true, url: ${JSON.stringify(sourceUrl)} }], create: async () => ({}), update: async () => ({}), onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
  scripting: { executeScript: async () => [{ result: ${JSON.stringify(recipe)} }] },
  storage: { session: { set: async () => {} } },
  runtime: { getURL: (path) => "/extension/" + path },
};`);
const panel = "document.querySelector('.side iframe').contentDocument";
await page.open(`${statics}/scripts/store/browser.html`, `${panel}?.getElementById('panel-state')?.dataset.state === 'found' && ${panel}.getElementById('photo').complete && document.querySelector('.content > iframe').contentDocument.images[0]?.complete`);
await page.evaluate(`[...${panel}.querySelectorAll('#ingredients input')].slice(0, 2).forEach((box) => box.click()); true`);
await writeFile(new URL("../../public/screens/extension-browser.webp", import.meta.url), await sharp(await page.png()).webp({ quality: 84 }).toBuffer());
process.stdout.write("public/screens/extension-browser.webp\n");
page.close();
