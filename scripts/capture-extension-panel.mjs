import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = Number(process.env.KC_CDP_PORT || 9228);
const base = process.env.KC_PREVIEW_URL || "http://127.0.0.1:8765/extension/sidepanel.html";
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
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
const states = ["loading", "parser", "found", "no-recipe", "access-error", "extraction-error", "signed-out", "signed-in", "already-saved", "saved"];
for (const state of states) {
  await send("Page.navigate", { url: `${base}?preview=${state}&theme=light` });
  await new Promise((resolve) => setTimeout(resolve, 100));
  const result = await send("Runtime.evaluate", {
    expression: `new Promise((resolve, reject) => { const started = Date.now(); const check = async () => { const node = document.getElementById('panel-state'); if (node?.dataset.state === ${JSON.stringify(state)}) { await document.fonts.ready; resolve({ state: node.dataset.state, width: innerWidth, scrollWidth: document.documentElement.scrollWidth }); } else if (Date.now() - started > 5000) reject(Error('Preview timed out')); else setTimeout(check, 30); }; check(); })`,
    awaitPromise: true, returnByValue: true,
  });
  if (result.exceptionDetails) {
    const detail = await send("Runtime.evaluate", { expression: "({ href: location.href, ready: document.readyState, state: document.getElementById('panel-state')?.dataset.state, body: document.body?.textContent.slice(0, 200) })", returnByValue: true });
    throw Error(`Preview failed: ${state}: ${JSON.stringify(detail.result.value)}`);
  }
  assert.equal(result.result.value.state, state);
  assert.ok(result.result.value.scrollWidth <= 390, `Horizontal overflow in ${state}: ${JSON.stringify(result.result.value)}`);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  await writeFile(join(process.cwd(), "docs/screenshots", `kc-d12-${state}.png`), Buffer.from(shot.data, "base64"));
  process.stdout.write(`${state}: ${result.result.value.width}×844, scrollWidth ${result.result.value.scrollWidth}\n`);
}
await send("Page.navigate", { url: `${base}?preview=found&theme=dark` });
await new Promise((resolve) => setTimeout(resolve, 100));
await send("Runtime.evaluate", { expression: "new Promise(resolve => { const check = async () => { if (document.getElementById('panel-state')?.dataset.state === 'found') { await document.fonts.ready; resolve(true); } else setTimeout(check, 30); }; check(); })", awaitPromise: true });
const dark = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
await writeFile(join(process.cwd(), "docs/screenshots", "kc-d12-found-dark.png"), Buffer.from(dark.data, "base64"));
ws.close();
