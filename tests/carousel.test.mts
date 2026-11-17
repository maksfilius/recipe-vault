import test from "node:test";
import assert from "node:assert/strict";
import { getCenteredIndex, getSlideEmphasis } from "../src/lib/carousel.ts";

test("centered index follows the nearest snap point and stays in range", () => {
  assert.equal(getCenteredIndex(0, 300, 5), 0);
  assert.equal(getCenteredIndex(449, 300, 5), 1);
  assert.equal(getCenteredIndex(451, 300, 5), 2);
  assert.equal(getCenteredIndex(10_000, 300, 5), 4);
  assert.equal(getCenteredIndex(-50, 300, 5), 0);
  assert.equal(getCenteredIndex(100, 300, 0), 0);
  assert.equal(getCenteredIndex(100, 0, 5), 0);
});

test("neighbours shrink and fade with distance from the center", () => {
  assert.deepEqual(getSlideEmphasis(0), { scale: 1, opacity: 1 });
  assert.deepEqual(getSlideEmphasis(-1), { scale: 0.92, opacity: 0.55 });
  assert.deepEqual(getSlideEmphasis(3), { scale: 0.92, opacity: 0.55 });
  const half = getSlideEmphasis(0.5);
  assert.ok(Math.abs(half.scale - 0.96) < 1e-9);
  assert.ok(Math.abs(half.opacity - 0.775) < 1e-9);
});
