globalThis.keepAndCookOpenReader = (recipe, css) => {
  globalThis.keepAndCookReader?.close();
  const utils = globalThis.keepAndCookReaderUtils;
  if (!utils) throw new Error("Cooking controls could not load. Reload the extension and try again.");
  const previousFocus = document.activeElement;
  const previousOverflow = document.documentElement.style.overflow;
  const host = document.createElement("keep-and-cook-reader");
  const isPreview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.pathname.endsWith("/reader-preview.html");
  const root = host.attachShadow({ mode: isPreview ? "open" : "closed" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  root.adoptedStyleSheets = [sheet];
  const create = (tag, text = "", className = "") => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (label, action, className = "") => {
    const node = create("button", label, className);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  };

  const dialog = create("dialog");
  dialog.setAttribute("aria-label", `Cooking: ${recipe.title}`);
  const header = create("header");
  const headerInner = create("div", "", "header-inner");
  const title = create("h1", recipe.title);
  const tools = create("div", "", "tools");
  const timerStrip = create("ul", "", "timer-strip");
  timerStrip.setAttribute("aria-label", "Cooking timers");
  timerStrip.hidden = true;
  const status = create("p", "", "status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const main = create("main");
  const mainInner = create("div", "", "main-inner");
  const stepLabel = create("p", "", "step-label");
  const stage = create("div", "", "stage");
  const instruction = create("p", "", "instruction");
  instruction.setAttribute("aria-live", "polite");
  const measure = create("p", "", "instruction measure");
  measure.setAttribute("aria-hidden", "true");
  stage.append(instruction, measure);
  const suggestions = create("div", "", "suggestions");
  const footer = create("footer");
  const footerInner = create("div", "", "footer-inner");
  const progress = create("div", "", "progress-bar");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Cooking progress");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  const progressFill = create("div", "", "progress-fill");
  progress.append(progressFill);
  const navigation = create("nav");
  navigation.setAttribute("aria-label", "Cooking steps");
  const scrim = button("", () => closeDrawer(), "scrim");
  scrim.setAttribute("aria-label", "Close ingredients");
  scrim.tabIndex = -1;
  scrim.hidden = true;
  const drawer = create("aside", "", "drawer");
  drawer.hidden = true;
  drawer.id = "kc-ingredients";
  drawer.setAttribute("aria-label", "Ingredients");
  const drawerHeader = create("div", "", "drawer-header");
  const drawerHeading = create("div");
  const drawerCount = create("p", "", "drawer-count");
  drawerHeading.append(create("h2", "Ingredients"), drawerCount);
  const drawerClose = button("×", () => closeDrawer(), "icon-button");
  drawerClose.setAttribute("aria-label", "Back to step");
  drawerHeader.append(drawerHeading, drawerClose);
  const drawerTimers = create("div", "", "drawer-timers");
  drawerTimers.append(create("p", "Running timers", "timer-heading"));
  const ingredientList = create("ul", "", "ingredient-list");
  let checkedCount = 0;
  const ingredientButton = button("", () => openDrawer(), "tool-button");
  ingredientButton.setAttribute("aria-controls", drawer.id);
  ingredientButton.setAttribute("aria-expanded", "false");
  function updateIngredientCount() {
    ingredientButton.textContent = `Ingredients ${checkedCount}/${recipe.ingredients.length}`;
    ingredientButton.setAttribute("aria-label", `Ingredients, ${checkedCount} of ${recipe.ingredients.length} checked`);
    drawerCount.textContent = `${checkedCount} of ${recipe.ingredients.length} checked`;
  }
  for (const ingredient of recipe.ingredients) {
    const item = create("li");
    const label = create("label");
    const checkbox = create("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => { checkedCount += checkbox.checked ? 1 : -1; updateIngredientCount(); });
    label.append(checkbox, create("span", [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ")));
    item.append(label);
    ingredientList.append(item);
  }
  updateIngredientCount();
  drawer.append(drawerHeader, drawerTimers, ingredientList);

  let stepIndex = 0;
  let partIndex = 0;
  let parts = [recipe.steps[0]?.text ?? ""];
  let finished = false;
  let closed = false;
  let wakeLock;
  let wakePending = false;
  let timerInterval;
  let timerSequence = 0;
  let audioContext;
  const timers = [];
  const timerNodes = new Map();
  const rung = new Set();

  function openDrawer() {
    drawer.hidden = false;
    scrim.hidden = false;
    ingredientButton.setAttribute("aria-expanded", "true");
    drawerClose.focus();
  }
  function closeDrawer() {
    drawer.hidden = true;
    scrim.hidden = true;
    ingredientButton.setAttribute("aria-expanded", "false");
    ingredientButton.focus();
  }
  function updateProgress() {
    const value = finished ? 100 : ((stepIndex + (partIndex + 1) / Math.max(1, parts.length)) / recipe.steps.length) * 100;
    progressFill.style.width = `${value}%`;
    progress.setAttribute("aria-valuenow", String(Math.round(value)));
  }
  const previous = button("←  Previous", () => {
    if (finished) { finished = false; renderPart(); return; }
    if (partIndex > 0) { partIndex -= 1; renderPart(); }
    else if (stepIndex > 0) enterStep(stepIndex - 1, true);
  }, "secondary");
  const next = button("Next step  →", () => {
    if (finished) { close(); return; }
    if (partIndex < parts.length - 1) { partIndex += 1; renderPart(); }
    else if (stepIndex < recipe.steps.length - 1) enterStep(stepIndex + 1);
    else { finished = true; renderPart(); }
  }, "primary");
  function renderPart() {
    if (finished) {
      stepLabel.textContent = "Cooking complete";
      instruction.textContent = "Enjoy your meal. Save this recipe to your library or download a copy before closing.";
      suggestions.hidden = true;
      previous.disabled = false;
      next.textContent = "Close cooking  ×";
      updateProgress();
      return;
    }
    stepLabel.textContent = `Step ${stepIndex + 1} of ${recipe.steps.length}${parts.length > 1 ? ` · Part ${partIndex + 1} of ${parts.length}` : ""}`;
    instruction.textContent = parts[partIndex] ?? recipe.steps[stepIndex].text;
    previous.disabled = stepIndex === 0 && partIndex === 0;
    next.textContent = partIndex < parts.length - 1 ? "Continue step  →" : stepIndex < recipe.steps.length - 1 ? "Next step  →" : "Finish cooking  ✓";
    renderSuggestions();
    updateProgress();
  }
  function paginate(last = false) {
    if (finished || stage.clientHeight < 40 || stage.clientWidth < 40) return;
    const style = getComputedStyle(stage);
    const available = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 4;
    const nextParts = utils.paginate(recipe.steps[stepIndex].text, (candidate) => {
      measure.textContent = candidate;
      return measure.scrollHeight <= available;
    });
    if (!nextParts.length) nextParts.push(recipe.steps[stepIndex].text);
    partIndex = last ? nextParts.length - 1 : utils.remap(parts, partIndex, nextParts);
    parts = nextParts;
    renderPart();
  }
  function enterStep(index, last = false) {
    stepIndex = index;
    partIndex = 0;
    parts = [recipe.steps[index].text];
    paginate(last);
  }

  function primeAudio() {
    try {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ??= new AudioContextClass();
      void audioContext.resume().catch(() => undefined);
    } catch { audioContext = undefined; }
  }
  function ring() {
    if (audioContext) {
      try {
        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
        for (const offset of [0, 0.32]) {
          const oscillator = audioContext.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = 880;
          oscillator.connect(gain);
          oscillator.start(now + offset);
          oscillator.stop(now + offset + 0.22);
        }
      } catch { /* Audio is best effort. */ }
    }
    navigator.vibrate?.([200, 100, 200]);
  }
  function tickTimers() {
    const now = Date.now();
    timerStrip.hidden = timers.length === 0;
    drawerTimers.hidden = timers.length === 0;
    let hasNewAlarm = false;
    for (const timer of timers) {
      const remaining = (timer.endsAt - now) / 1000;
      if (remaining <= 0 && !rung.has(timer.id) && document.visibilityState === "visible") { rung.add(timer.id); hasNewAlarm = true; }
      const label = remaining <= 0 ? "Done" : utils.countdown(remaining);
      let nodes = timerNodes.get(timer.id);
      if (!nodes) {
        const chip = create("li", "", "timer-chip");
        const time = create("span", "", "timer-time");
        chip.append(time, create("span", `${timer.label} · step ${timer.stepIndex + 1}`, "timer-caption"));
        const dismiss = button("×", () => {
          const index = timers.findIndex((item) => item.id === timer.id);
          if (index !== -1) timers.splice(index, 1);
          rung.delete(timer.id);
          tickTimers();
        }, "timer-dismiss");
        dismiss.setAttribute("aria-label", `Dismiss ${timer.label} timer`);
        chip.append(dismiss);
        const drawerChip = create("div", "", "drawer-timer-chip");
        timerStrip.append(chip);
        drawerTimers.append(drawerChip);
        nodes = { chip, time, drawerChip };
        timerNodes.set(timer.id, nodes);
      }
      nodes.time.textContent = `◷ ${label}`;
      nodes.drawerChip.textContent = `${timer.label} · step ${timer.stepIndex + 1}: ${label}`;
    }
    for (const [id, nodes] of timerNodes) {
      if (timers.some((timer) => timer.id === id)) continue;
      nodes.chip.remove();
      nodes.drawerChip.remove();
      timerNodes.delete(id);
    }
    if (hasNewAlarm) ring();
    if (!timers.length && timerInterval) { clearInterval(timerInterval); timerInterval = undefined; }
  }
  function renderSuggestions() {
    suggestions.replaceChildren();
    const found = utils.durations(recipe.steps[stepIndex].text);
    suggestions.hidden = found.length === 0;
    if (!found.length) return;
    suggestions.append(create("p", "Start a timer from this step", "timer-heading"));
    const buttons = create("div", "", "suggestion-buttons");
    for (const item of found) {
      buttons.append(button(`◷  ${item.label}`, () => {
        primeAudio();
        timers.push({ id: ++timerSequence, label: item.label, endsAt: Date.now() + item.seconds * 1000, stepIndex });
        tickTimers();
        timerInterval ??= setInterval(tickTimers, 500);
      }, "secondary"));
    }
    suggestions.append(buttons);
  }

  async function keepAwake() {
    if (closed || wakePending || document.visibilityState !== "visible" || wakeLock && !wakeLock.released) return;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock?.request("screen");
      if (closed || document.visibilityState !== "visible") void lock?.release();
      else wakeLock = lock;
    } catch { wakeLock = undefined; }
    finally { wakePending = false; }
  }
  function onVisibility() {
    if (document.visibilityState === "visible") { void keepAwake(); tickTimers(); }
    else { void wakeLock?.release(); wakeLock = undefined; }
  }
  function close() {
    if (closed) return;
    closed = true;
    observer.disconnect();
    if (timerInterval) clearInterval(timerInterval);
    document.removeEventListener("visibilitychange", onVisibility);
    void wakeLock?.release();
    void audioContext?.close().catch(() => undefined);
    dialog.close();
    host.remove();
    document.documentElement.style.overflow = previousOverflow;
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  const save = button("Save", async () => {
    save.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({ type: "save-recipe", recipe });
      if (!result?.ok) throw new Error("Could not open Keep & Cook.");
      status.textContent = "Review in the opened tab. This recipe has not been saved yet.";
    } catch { status.textContent = "Could not open Keep & Cook. Please try again."; }
    finally { save.disabled = false; }
  }, "tool-button");
  const download = button("Download", () => {
    const text = [recipe.title, recipe.sourceUrl, recipe.description, "", "Ingredients", ...recipe.ingredients.map((item) => [item.amount, item.unit, item.name].filter(Boolean).join(" ")), "", "Method", ...recipe.steps.map((step, index) => `${index + 1}. ${step.text}`)].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = create("a");
    link.href = url;
    link.download = `${recipe.title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "recipe"}.txt`;
    root.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, "tool-button download-button");
  const closeButton = button("×", close, "icon-button");
  closeButton.setAttribute("aria-label", "Exit cooking mode");
  tools.append(ingredientButton, download, save, closeButton);
  headerInner.append(title, tools);
  header.append(headerInner, timerStrip);
  mainInner.append(stepLabel, stage, suggestions);
  main.append(mainInner);
  navigation.append(previous, next);
  footerInner.append(progress, navigation);
  footer.append(footerInner);
  dialog.append(header, status, main, footer, scrim, drawer);
  root.append(dialog);
  document.documentElement.append(host);
  if (globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches) dialog.classList.add("dark");
  const observer = new ResizeObserver(() => { if (!closed) paginate(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); if (!drawer.hidden) closeDrawer(); else close(); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); if (!drawer.hidden) closeDrawer(); else close(); return; }
    if (event.key === "Tab") {
      const scope = drawer.hidden ? dialog : drawer;
      const focusable = Array.from(scope.querySelectorAll("button:not([disabled]), a[href], input:not([disabled])")).filter((node) => node.getClientRects().length);
      if (focusable.length) {
        if (event.shiftKey && root.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
        else if (!event.shiftKey && root.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
      }
      return;
    }
    if (!drawer.hidden || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      (event.key === "ArrowLeft" ? previous : next).click();
    }
  });
  dialog.showModal();
  document.documentElement.style.overflow = "hidden";
  closeButton.focus();
  paginate();
  observer.observe(stage);
  document.addEventListener("visibilitychange", onVisibility);
  void keepAwake();
  globalThis.keepAndCookReader = { close };
};
