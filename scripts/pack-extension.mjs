// Builds the Chrome Web Store zip from extension/.
// Run on a tagged commit: git tag extension-v<manifest version> && node scripts/pack-extension.mjs
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "extension");
// Docs and localhost design previews are not part of the shipped extension.
const EXCLUDE = new Set(["README.md", "reader-preview.html", "reader-preview.js"]);

const { version } = JSON.parse(await readFile(path.join(SOURCE, "manifest.json"), "utf8"));
const tags = execFileSync("git", ["tag", "--points-at", "HEAD", "--list", "extension-v*"], { encoding: "utf8" }).split("\n").filter(Boolean);
if (!tags.includes(`extension-v${version}`)) {
  console.error(`HEAD must be tagged extension-v${version} (manifest version). Found: ${tags.join(", ") || "no extension tag"}.`);
  process.exit(1);
}
if (execFileSync("git", ["status", "--porcelain", "--", "extension"], { encoding: "utf8" }).trim()) {
  console.error("extension/ has uncommitted changes; the zip would not match the tag.");
  process.exit(1);
}

const stage = path.join(ROOT, "dist", "extension");
const zip = path.join(ROOT, "dist", `keep-and-cook-extension-${version}.zip`);
await rm(stage, { recursive: true, force: true });
await rm(zip, { force: true });
await mkdir(stage, { recursive: true });
await cp(SOURCE, stage, { recursive: true, filter: (file) => !EXCLUDE.has(path.basename(file)) && path.basename(file) !== ".DS_Store" });
execFileSync("zip", ["-qrX", zip, "."], { cwd: stage });
console.log(`Packed ${path.relative(ROOT, zip)}. Unzipped copy for Load unpacked: ${path.relative(ROOT, stage)}`);
