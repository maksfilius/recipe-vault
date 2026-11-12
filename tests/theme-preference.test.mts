import test from "node:test";
import assert from "node:assert/strict";
import { normalizeThemePreference, resolveTheme } from "../src/lib/theme-preference.ts";

test("theme preference keeps existing dark default and accepts System", () => {
  assert.equal(normalizeThemePreference(null), "dark");
  assert.equal(normalizeThemePreference("system"), "system");
  assert.equal(normalizeThemePreference("light"), "light");
  assert.equal(normalizeThemePreference("unexpected"), "dark");
});

test("System follows the device while explicit choices stay fixed", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("light", true), "light");
});
