import assert from "node:assert/strict";
import test from "node:test";

import { paginateStepText, remapPageIndex } from "../src/lib/cooking-step-pages.ts";

test("keeps every word in order while fitting a long instruction into pages", () => {
  const instruction = "Chop the onion. Stir it into the pan. Simmer for 20 minutes.";
  const pages = paginateStepText(instruction, (candidate) => candidate.length <= 26);

  assert.ok(pages.length > 1);
  assert.ok(pages.every((page) => page.length <= 26));
  assert.equal(pages.join(" ").replace(/\s+/g, " "), instruction);
});

test("splits an unbroken token when it cannot fit on one page", () => {
  const pages = paginateStepText("supercalifragilistic", (candidate) => candidate.length <= 5);

  assert.deepEqual(pages, ["super", "calif", "ragil", "istic"]);
});

test("keeps meaningful line breaks and ignores empty instructions", () => {
  assert.deepEqual(paginateStepText("  \n  ", () => true), []);
  assert.deepEqual(paginateStepText("Mix flour.\nBake slowly.", () => true), ["Mix flour.\nBake slowly."]);
});

test("always makes progress if even one character exceeds the available height", () => {
  assert.deepEqual(paginateStepText("abc", () => false), ["a", "b", "c"]);
});

test("keeps the reading position when a viewport change creates more pages", () => {
  const before = ["alpha bravo", "charlie delta", "echo foxtrot"];
  const after = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];

  assert.equal(remapPageIndex(before, 1, after), 2);
  assert.equal(remapPageIndex(before, 2, after), 4);
  assert.equal(remapPageIndex(before, 0, after), 0);
});
