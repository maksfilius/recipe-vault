// Runs the landing demo end to end ("Try an example", then "Show full recipe") and captures the
// result on desktop and phone, plus the error state for a page without a recipe.
//   node scripts/store/capture-hero-import.mjs   (app on KC_APP_URL, Chrome on KC_CDP_PORT)
// It calls the real /api/recipes/import, which fetches the sample page from the web.
import { writeFile } from "node:fs/promises";
import { connect } from "./cdp.mjs";

const app = (process.env.KC_APP_URL || "http://localhost:3100").replace(/\/$/, "");
const theme = process.env.KC_THEME || "light";
const page = await connect();
// Transitions off, so a capture never catches a button mid-way from its loading colour.
await page.beforeLoad(`try { localStorage.setItem("theme", "${theme}"); } catch {} document.addEventListener("DOMContentLoaded", () => { const style = document.createElement("style"); style.textContent = "*, *::before, *::after { transition: none !important; }"; document.head.append(style); });`);

const clipOf = (selector) => page.evaluate(`(() => { const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: 0, y: Math.max(0, box.top + scrollY - 16), width: innerWidth, height: box.height + 32 }; })()`);
const overflow = () => page.evaluate("document.documentElement.scrollWidth > innerWidth ? document.documentElement.scrollWidth : 0");

for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
  await page.viewport(width, height, 2, width < 600);
  await page.open(`${app}/`);
  await page.evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Try an example').click(); true");
  await page.waitFor("document.getElementById('hero-recipe-preview')", 40000);
  await page.evaluate("Promise.all([...document.querySelectorAll('#hero-recipe-preview img')].map((img) => img.decode().catch(() => {})))");
  const collapsed = await clipOf("#try-it");
  await writeFile(`docs/screenshots/hero-import-${theme}-${label}.png`, await page.png(collapsed));
  const before = await overflow();
  await page.evaluate("[...document.querySelectorAll('#hero-recipe-preview button')].find((button) => button.textContent.startsWith('Show full recipe')).click(); true");
  await page.waitFor("document.querySelector('#hero-recipe-preview [aria-expanded=true]')");
  const after = await overflow();
  if (label === "mobile") await writeFile(`docs/screenshots/hero-import-${theme}-mobile-expanded.png`, await page.png(await clipOf("#try-it")));
  const counts = await page.evaluate("({ ingredients: document.querySelectorAll('#hero-recipe-preview ul li').length, steps: document.querySelectorAll('#hero-recipe-preview ol li').length, save: [...document.querySelectorAll('#hero-recipe-preview a')].find((a) => a.textContent.includes('Save to my free cookbook'))?.getAttribute('href') })");
  process.stdout.write(`${label}: overflow ${before || "none"} → ${after || "none"} after expanding; ${JSON.stringify(counts)}\n`);
}

// Error state: a page without a recipe.
await page.viewport(390, 844, 2, true);
await page.open(`${app}/`);
await page.evaluate(`(() => { const input = document.getElementById('hero-recipe-url'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'https://example.com/'); input.dispatchEvent(new Event('input', { bubbles: true })); input.form.requestSubmit(); return true; })()`);
await page.waitFor("document.getElementById('hero-import-error')", 40000);
process.stdout.write(`error: ${await page.evaluate("document.getElementById('hero-import-error').textContent")}\n`);
await writeFile(`docs/screenshots/hero-import-${theme}-mobile-error.png`, await page.png(await clipOf("#try-it")));
page.close();
