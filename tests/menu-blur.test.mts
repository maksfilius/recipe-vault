import test from "node:test";
import assert from "node:assert/strict";
import { shouldCloseMenuOnBlur } from "../src/lib/menu-blur.ts";

const menu = { contains: (node: unknown) => node === "inside" };

test("a menu stays open when Safari blurs to nothing on a tap inside it", () => {
  // Safari does not focus a tapped button, so focus moves to no element at all.
  assert.equal(shouldCloseMenuOnBlur(menu, null), false);
});

test("a menu stays open when focus moves to one of its items", () => {
  assert.equal(shouldCloseMenuOnBlur(menu, "inside"), false);
});

test("a menu closes when keyboard focus leaves it", () => {
  assert.equal(shouldCloseMenuOnBlur(menu, "outside"), true);
});
