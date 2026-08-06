import assert from "node:assert/strict";
import test from "node:test";

import {
  findStepDurations,
  formatCountdown,
  formatDurationLabel,
} from "../src/lib/step-durations.ts";

test("finds English durations", () => {
  assert.deepEqual(findStepDurations("Simmer for 20 minutes, stirring often."), [
    { label: "20 min", seconds: 1200 },
  ]);
  assert.deepEqual(findStepDurations("Bake 1 hour until golden."), [
    { label: "1 h", seconds: 3600 },
  ]);
  assert.deepEqual(findStepDurations("Rest 30 secs"), [{ label: "30 s", seconds: 30 }]);
});

test("finds Russian and German durations", () => {
  assert.deepEqual(findStepDurations("Тушить 25 минут под крышкой."), [
    { label: "25 min", seconds: 1500 },
  ]);
  assert.deepEqual(findStepDurations("Варить 2 часа."), [{ label: "2 h", seconds: 7200 }]);
  assert.deepEqual(findStepDurations("15 Minuten backen."), [
    { label: "15 min", seconds: 900 },
  ]);
});

test("takes the lower bound of a range so food is checked early", () => {
  assert.deepEqual(findStepDurations("Fry for 10-12 minutes."), [
    { label: "10 min", seconds: 600 },
  ]);
  assert.deepEqual(findStepDurations("Bake 40 to 45 min."), [
    { label: "40 min", seconds: 2400 },
  ]);
});

test("handles fractional amounts in both decimal separators", () => {
  assert.deepEqual(findStepDurations("Chill 1.5 hours."), [
    { label: "1 h 30 min", seconds: 5400 },
  ]);
  assert.deepEqual(findStepDurations("Настаивать 1,5 часа."), [
    { label: "1 h 30 min", seconds: 5400 },
  ]);
});

test("ignores quantities that are not durations", () => {
  assert.deepEqual(findStepDurations("Add 200 g flour and 250 ml milk."), []);
  assert.deepEqual(findStepDurations("Preheat the oven to 220 degrees."), []);
  assert.deepEqual(findStepDurations("Добавить 300 г муки."), []);
  // A unit letter that merely starts a longer word must not match.
  assert.deepEqual(findStepDurations("Через 5 часов проверить."), [
    { label: "5 h", seconds: 18000 },
  ]);
});

test("keeps several distinct durations but drops duplicates", () => {
  assert.deepEqual(findStepDurations("Fry 5 minutes, then bake 30 minutes, rest 5 min."), [
    { label: "5 min", seconds: 300 },
    { label: "30 min", seconds: 1800 },
  ]);
});

test("rejects implausible durations", () => {
  assert.deepEqual(findStepDurations("Age for 48 hours."), []);
  assert.deepEqual(findStepDurations("Wait 2 seconds."), []);
});

test("formats labels and countdowns", () => {
  assert.equal(formatDurationLabel(45), "45 s");
  assert.equal(formatDurationLabel(600), "10 min");
  assert.equal(formatDurationLabel(3600), "1 h");
  assert.equal(formatDurationLabel(5400), "1 h 30 min");
  assert.equal(formatCountdown(59.4), "1:00");
  assert.equal(formatCountdown(90), "1:30");
  assert.equal(formatCountdown(3725), "1:02:05");
  assert.equal(formatCountdown(-4), "0:00");
});
