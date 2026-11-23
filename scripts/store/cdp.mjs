// Minimal Chrome DevTools Protocol client for the store/landing capture scripts.
// Start Chrome with --remote-debugging-port=<KC_CDP_PORT> (default 9230) before running them.
export async function connect(port = Number(process.env.KC_CDP_PORT || 9230)) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("No Chrome page target available");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const entry = message.id && pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(`${result.exceptionDetails.exception?.description || result.exceptionDetails.text}\n${expression.slice(0, 200)}`);
    return result.result.value;
  };
  // Resolves when `condition` (a JS expression) is truthy in the page.
  const waitFor = (condition, timeout = 15000) => evaluate(`new Promise((resolve, reject) => { const start = Date.now(); const check = () => { let value; try { value = (${condition}); } catch {} if (value) resolve(true); else if (Date.now() - start > ${timeout}) reject(new Error(${JSON.stringify(`Timed out: ${condition}`)})); else setTimeout(check, 50); }; check(); })`);
  let initScript;
  const page = {
    send, evaluate, waitFor,
    async viewport(width, height, scale = 2, mobile = width < 600) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
    },
    // Runs before any page script on the next navigations; replaces the previous one.
    async beforeLoad(source) {
      if (initScript) await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: initScript });
      initScript = source ? (await send("Page.addScriptToEvaluateOnNewDocument", { source })).identifier : undefined;
    },
    async open(url, ready) {
      await send("Page.navigate", { url });
      await waitFor("document.readyState === 'complete'");
      if (ready) await waitFor(ready);
      await evaluate("document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))");
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    async png(clip) {
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: Boolean(clip), ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      return Buffer.from(shot.data, "base64");
    },
    close: () => ws.close(),
  };
  return page;
}
