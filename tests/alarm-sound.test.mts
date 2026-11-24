import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { playAlarm } from "../src/lib/alarm-sound.ts";

const context = { Intl, RegExp, Set, Array, Math, Number, String, Promise, setTimeout };
runInNewContext(readFileSync(new URL("../extension/reader-utils.js", import.meta.url), "utf8"), context);
const extensionAlarm = (context as typeof context & { keepAndCookReaderUtils: { alarm: (audio: unknown) => Promise<boolean> } }).keepAndCookReaderUtils.alarm;

// Records every scheduled call so the two implementations can be compared.
function fakeAudio(state = "running", resumes = true) {
  const log: unknown[][] = [];
  let nodes = 0;
  const param = (id: number, name: string) => ({
    set value(v: number) { log.push([id, name, "value", v]); },
    setValueAtTime: (...a: number[]) => log.push([id, name, "set", ...a]),
    linearRampToValueAtTime: (...a: number[]) => log.push([id, name, "linear", ...a]),
    exponentialRampToValueAtTime: (...a: number[]) => log.push([id, name, "exp", ...a]),
  });
  const node = () => {
    const id = ++nodes;
    return { id, gain: param(id, "gain"), frequency: param(id, "frequency"), set type(t: string) { log.push([id, "type", t]); },
      connect: (to: { id: number }) => log.push([id, "connect", to.id]), start: (t: number) => log.push([id, "start", t]), stop: (t: number) => log.push([id, "stop", t]) };
  };
  const audio = { state, currentTime: 10, destination: { id: 0 }, createGain: node, createOscillator: node,
    resume: () => { if (resumes) audio.state = "running"; return resumes ? Promise.resolve() : new Promise(() => {}); } };
  return { audio, log };
}

test("extension and PWA schedule the same alarm", async () => {
  const pwa = fakeAudio();
  const extension = fakeAudio();
  assert.equal(await playAlarm(pwa.audio as never), true);
  assert.equal(await extensionAlarm(extension.audio), true);
  assert.deepEqual(extension.log, pwa.log);
});

test("alarm is three ~350 ms beeps, each with its own envelope, below clipping", async () => {
  const { audio, log } = fakeAudio();
  await playAlarm(audio as never);
  const attacks = log.filter((entry) => entry[2] === "linear");
  assert.equal(attacks.length, 3);
  assert.equal(new Set(attacks.map((entry) => entry[0])).size, 3);
  const starts = [...new Set(log.filter((entry) => entry[1] === "start").map((entry) => entry[2] as number))];
  assert.equal(starts.length, 3);
  const decays = log.filter((entry) => entry[2] === "exp").map((entry) => entry[4] as number);
  decays.forEach((end, index) => assert.ok(Math.abs(end - starts[index] - 0.35) < 1e-9));
  assert.ok(starts[1] - starts[0] > 0.35, "beeps are separated by a pause");
  const peak = log.filter((entry) => entry[1] === "gain" && entry[2] === "value").reduce((sum, entry) => sum + (entry[3] as number), 0) / 3;
  assert.ok(peak <= 1, `summed tone level ${peak} must not clip`);
  assert.equal(new Set(log.filter((entry) => entry[1] === "frequency").map((entry) => entry[3])).size, 2);
});

test("alarm reports blocked or missing audio instead of throwing", async () => {
  assert.equal(await playAlarm(null), false);
  assert.equal(await extensionAlarm(undefined), false);
  const suspended = fakeAudio("suspended", true);
  assert.equal(await playAlarm(suspended.audio as never), true);
  const blocked = fakeAudio("suspended", false);
  assert.equal(await playAlarm(blocked.audio as never), false);
  assert.equal(await extensionAlarm(fakeAudio("suspended", false).audio), false);
  const broken = { ...fakeAudio().audio, createGain: () => { throw new Error("closed"); } };
  assert.equal(await playAlarm(broken as never), false);
});
