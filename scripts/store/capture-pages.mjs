// Full-page screenshots of public marketing pages for before/after review.
//   node scripts/store/capture-pages.mjs <prefix> [/path ...]   (app on KC_APP_URL, Chrome on KC_CDP_PORT)
import { writeFile } from "node:fs/promises";
import { connect } from "./cdp.mjs";

const app = (process.env.KC_APP_URL || "http://localhost:3100").replace(/\/$/, "");
const [prefix = "landing", ...paths] = process.argv.slice(2);
const page = await connect();
const theme = process.env.KC_THEME; // "light" or "dark"; unset keeps the visitor default
await page.beforeLoad(`${theme ? `try { localStorage.setItem("theme", "${theme}"); } catch {}` : `try { localStorage.removeItem("theme"); } catch {}`} document.addEventListener("DOMContentLoaded", () => { const style = document.createElement("style"); style.textContent = "nextjs-portal{display:none!important}"; document.head.append(style); });`);
for (const path of paths.length ? paths : ["/"]) {
  for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    await page.viewport(width, height, 1, width < 600);
    await page.open(`${app}${path}`);
    // A full-page capture never scrolls, so lazy images below the fold would stay blank.
    await page.evaluate("Promise.all([...document.images].map((img) => { img.loading = 'eager'; return img.decode().catch(() => {}); }))");
    const size = await page.evaluate("({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })");
    const name = `docs/screenshots/${prefix}${theme ? `-${theme}` : ""}${path === "/" ? "-home" : path.replaceAll("/", "-")}-${label}.png`;
    await writeFile(name, await page.png({ x: 0, y: 0, width, height: size.height }));
    process.stdout.write(`${name} ${size.width}×${size.height}${size.width > width ? " HORIZONTAL OVERFLOW" : ""}\n`);
  }
}
page.close();
