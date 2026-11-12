import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const webCss = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const extensionUrl = new URL("../extension/tokens.css", import.meta.url);
const extensionCss = existsSync(extensionUrl) ? readFileSync(extensionUrl, "utf8") : "";

const sharedColors = [
  "background", "foreground", "card", "primary", "primary-hover",
  "primary-foreground", "muted", "muted-foreground", "border",
  "destructive", "destructive-foreground", "ring",
];

function themeTokens(css: string, selector: ":root" | ".dark") {
  const escaped = selector.replace(".", "\\.");
  const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  return new Map(Array.from(block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g), ([, name, value]) => [name, value.trim()]));
}

for (const selector of [":root", ".dark"] as const) {
  test(`extension ${selector} colors stay synchronized with the web theme`, () => {
    const web = themeTokens(webCss, selector);
    const extension = themeTokens(extensionCss, selector);
    for (const color of sharedColors) {
      assert.ok(web.has(color), `web ${selector} is missing --${color}`);
      assert.ok(extension.has(color), `extension ${selector} is missing --${color}`);
      assert.equal(extension.get(color), web.get(color), `${selector} --${color} differs`);
    }
    for (const [name, value] of web) {
      if (extension.has(name)) assert.equal(extension.get(name), value, `${selector} --${name} differs`);
    }
  });
}
