import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../extension/reader-utils.js", import.meta.url), "utf8");
const context = { Intl, RegExp, Set, Array, Math, Number, String };
runInNewContext(script, context);
const utils = (context as typeof context & { keepAndCookReaderUtils: {
  paginate: (text: string, fits: (candidate: string) => boolean) => string[];
  remap: (before: string[], index: number, after: string[]) => number;
  durations: (text: string) => { label: string; seconds: number }[];
  countdown: (seconds: number) => string;
} }).keepAndCookReaderUtils;

test("reader pages long steps without losing words and maps position after resize", () => {
  const text = "Mix flour with salt, then pour in warm water and stir until smooth.";
  const small = utils.paginate(text, (candidate) => candidate.length <= 22);
  const large = utils.paginate(text, (candidate) => candidate.length <= 42);
  assert.ok(small.length > large.length);
  assert.equal(small.join(" ").replace(/\s+/g, " "), text);
  assert.ok(utils.remap(small, 2, large) >= 1);
  assert.ok(utils.remap(large, large.length - 1, small) >= 1);
});

test("reader splits unbroken text and keeps countdowns on absolute deadlines", () => {
  const pieces = utils.paginate("extraordinaryword", (candidate) => candidate.length <= 5);
  assert.equal(pieces.join(""), "extraordinaryword");
  assert.deepEqual(Array.from(utils.durations("Bake for 10 minutes, then rest for 30 min."), ({ seconds }) => seconds), [600, 1800]);
  assert.equal(utils.countdown(300), "5:00");
  assert.equal(utils.countdown(1500), "25:00");
  assert.equal(utils.countdown(-1), "0:00");
});
