import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = Number(process.env.KC_CDP_PORT || 9228);
const base = process.env.KC_READER_PREVIEW_URL || "http://127.0.0.1:8765/extension/reader-preview.html";
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((item) => item.type === "page");
assert.ok(target, "No Chrome page target available");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(Error(message.error.message));
  else entry.resolve(message.result);
});
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text || "Browser evaluation failed");
  return result.result.value;
}
async function capture(name, width, height) {
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width, height, scale: 1 } });
  await writeFile(join(process.cwd(), "docs/screenshots", `kc-d13-${name}.png`), Buffer.from(screenshot.data, "base64"));
}
async function open(width, height, theme = "light") {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await send("Page.navigate", { url: `${base}?theme=${theme}` });
  const view = await evaluate(`new Promise((resolve, reject) => { const start = Date.now(); const check = () => { const root = document.querySelector('keep-and-cook-reader')?.shadowRoot; const dialog = root?.querySelector('dialog'); const footer = root?.querySelector('footer'); if (dialog?.open && footer && root.querySelector('.step-label')?.textContent) resolve({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, footerBottom: footer.getBoundingClientRect().bottom, label: root.querySelector('.step-label').textContent, navBottom: root.querySelector('nav').getBoundingClientRect().bottom }); else if (Date.now() - start > 5000) reject(Error('Reader timed out')); else setTimeout(check, 30); }; check(); })`);
  await evaluate("document.fonts.ready.then(() => true)");
  return view;
}
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844], ["short", 900, 450]]) {
  const view = await open(width, height);
  view.fontLoaded = await evaluate("document.fonts.check('20px Fraunces')");
  if (name === "desktop") {
    const embeddedFont = await evaluate(`(async () => { chrome.runtime.getURL = (path) => new URL(path, location.href).href; const { readerStyles } = await import('./shared.js'); const styles = await readerStyles(); return styles.includes('data:font/woff2;base64,') && !styles.includes('KC_FRAUNCES_URL'); })()`);
    assert.equal(embeddedFont, true, "Extension reader font was not embedded");
  }
  assert.equal(view.width, width);
  assert.ok(view.scrollWidth <= width, `${name}: horizontal overflow ${view.scrollWidth}`);
  assert.ok(view.footerBottom <= height + 1 && view.navBottom <= height, `${name}: navigation offscreen`);
  await capture(name, width, height);
  process.stdout.write(`${name}: ${width}×${height}, ${view.label}, nav bottom ${view.navBottom}, Fraunces ${view.fontLoaded}\n`);
}
const mobile = await open(390, 844);
assert.match(mobile.label, /Part 1 of/);
const wake = await evaluate(`(async () => { const before = __kcWakePreview.requests; Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); await new Promise(resolve => setTimeout(resolve, 0)); const released = __kcWakePreview.releases; Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); document.dispatchEvent(new Event('visibilitychange')); await new Promise(resolve => setTimeout(resolve, 0)); return { before, released, after: __kcWakePreview.requests }; })()`);
assert.ok(wake.before > 0 && wake.released > 0 && wake.after > wake.before, "Wake lock did not recover after visibility change");
const behavior = await evaluate(`(async () => {
  const root = document.querySelector('keep-and-cook-reader').shadowRoot;
  const label = () => root.querySelector('.step-label').textContent;
  const next = root.querySelector('nav .primary');
  const previous = root.querySelector('nav .secondary');
  const firstParts = Number(label().match(/Part 1 of (\\d+)/)[1]);
  for (let index = 1; index < firstParts; index++) next.click();
  const lastPart = label();
  next.click();
  const secondStep = label();
  previous.click();
  const returned = label();
  root.querySelector('.suggestion-buttons button').click();
  root.querySelectorAll('.suggestion-buttons button')[1].click();
  const timerBefore = Array.from(root.querySelectorAll('.timer-time'), item => item.textContent);
  const actualNow = Date.now;
  Date.now = () => actualNow() + 300000;
  document.dispatchEvent(new Event('visibilitychange'));
  const timerAfter = Array.from(root.querySelectorAll('.timer-time'), item => item.textContent);
  Date.now = actualNow;
  root.querySelector('.tools button').click();
  const checkbox = root.querySelector('.ingredient-list input');
  checkbox.click();
  const checked = checkbox.checked;
  root.querySelector('.drawer .icon-button').click();
  root.querySelector('.tools button').click();
  const persisted = root.querySelector('.ingredient-list input').checked;
  return { firstParts, lastPart, secondStep, returned, timerBefore, timerAfter, checked, persisted, drawerOpen: !root.querySelector('.drawer').hidden };
})()`);
assert.ok(behavior.firstParts > 1);
assert.match(behavior.lastPart, new RegExp(`Part ${behavior.firstParts} of ${behavior.firstParts}`));
assert.match(behavior.secondStep, /Step 2 of 3/);
assert.equal(behavior.returned, behavior.lastPart);
assert.ok(behavior.checked && behavior.persisted && behavior.drawerOpen);
assert.ok(behavior.timerAfter.some((label) => label.includes("5:00")));
assert.ok(behavior.timerAfter.some((label) => label.includes("25:00")));
await capture("mobile-drawer", 390, 844);
await evaluate(`document.querySelector('keep-and-cook-reader').shadowRoot.querySelector('.drawer .icon-button').click()`);
const timerFocus = await evaluate(`new Promise(resolve => { const root = document.querySelector('keep-and-cook-reader').shadowRoot; const dismiss = root.querySelector('.timer-dismiss'); dismiss.focus(); setTimeout(() => resolve(root.activeElement === dismiss), 650); })`);
assert.equal(timerFocus, true, "Timer update moved keyboard focus");
await evaluate(`document.querySelector('keep-and-cook-reader').shadowRoot.querySelector('.tools .icon-button').focus()`);
await capture("mobile-timers", 390, 844);
await send("Emulation.setDeviceMetricsOverride", { width: 900, height: 450, deviceScaleFactor: 1, mobile: false });
const resized = await evaluate(`new Promise(resolve => setTimeout(() => { const root = document.querySelector('keep-and-cook-reader').shadowRoot; resolve({ label: root.querySelector('.step-label').textContent, navBottom: root.querySelector('nav').getBoundingClientRect().bottom }); }, 100))`);
assert.match(resized.label, /Part [2-9] of/);
assert.ok(resized.navBottom <= 450);
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evaluate("new Promise(resolve => setTimeout(resolve, 100))");
await evaluate(`document.querySelector('keep-and-cook-reader').shadowRoot.querySelector('.tools button').click()`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
const drawerEscape = await evaluate(`({ reader: Boolean(document.querySelector('keep-and-cook-reader')), drawerHidden: document.querySelector('keep-and-cook-reader')?.shadowRoot.querySelector('.drawer').hidden })`);
assert.ok(drawerEscape.reader && drawerEscape.drawerHidden, "Escape did not close only the ingredient drawer");
await evaluate(`document.querySelector('keep-and-cook-reader').shadowRoot.querySelector('.tools button').focus()`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
const afterArrow = await evaluate(`document.querySelector('keep-and-cook-reader').shadowRoot.querySelector('.step-label').textContent`);
assert.notEqual(afterArrow, behavior.returned);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
const closed = await evaluate(`({ reader: Boolean(document.querySelector('keep-and-cook-reader')), overflow: document.documentElement.style.overflow })`);
assert.equal(closed.reader, false);
assert.equal(closed.overflow, "");
process.stdout.write(`resize: ${resized.label}, keyboard: ${afterArrow}, Escape closed overlay\n`);
process.stdout.write(`behavior: ${JSON.stringify(behavior)}\n`);
await open(390, 844, "dark");
await capture("mobile-dark", 390, 844);
ws.close();
