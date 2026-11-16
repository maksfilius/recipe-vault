// How often the extension finds a recipe on the page itself, without calling /api/recipes/import.
// Run: node scripts/extension-extract-benchmark.mjs [git-ref-to-compare, e.g. main]
// Sites that block this script's fetch are reported separately; in a real browser they usually load.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { runExtensionExtract } from "./run-extension-extract.mjs";

const sites = JSON.parse(await readFile("scripts/parser-benchmark-sites.json", "utf8"));
const current = await readFile("extension/extract.js", "utf8");
const baseRef = process.argv[2];
const base = baseRef ? execFileSync("git", ["show", `${baseRef}:extension/extract.js`], { encoding: "utf8" }) : null;
const headers = { "user-agent": "Mozilla/5.0 (compatible; KeepAndCookBot/1.0; +https://keepandcook.com)", accept: "text/html" };

const found = (script, html, url) => { try { return Boolean(runExtensionExtract(script, html, url)); } catch { return false; } };
const rows = await Promise.all(sites.map(async ({ name, recipeUrl }) => {
  try {
    const response = await fetch(recipeUrl, { headers, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return { name, fetched: false };
    const html = await response.text();
    return { name, fetched: true, current: found(current, html, response.url), base: base ? found(base, html, response.url) : undefined };
  } catch { return { name, fetched: false }; }
}));

const fetched = rows.filter((row) => row.fetched);
const count = (key) => fetched.filter((row) => row[key]).length;
console.log(`Fetched ${fetched.length}/${rows.length}. Blocked: ${rows.filter((row) => !row.fetched).map((row) => row.name).join(", ") || "none"}`);
console.log(`Found on the page, current: ${count("current")}/${fetched.length}`);
if (base) {
  console.log(`Found on the page, ${baseRef}: ${count("base")}/${fetched.length}`);
  for (const row of fetched.filter((row) => row.current !== row.base)) console.log(`  ${row.current ? "+" : "-"} ${row.name}`);
}
console.log(`Still needs the server: ${fetched.filter((row) => !row.current).map((row) => row.name).join(", ") || "none"}`);
