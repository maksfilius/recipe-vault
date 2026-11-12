import { renderIngredients, recipeText, libraryUrl, readerStyles } from "./shared.js";

const appOrigin = "https://keepandcook.com";
const status = document.getElementById("status");
const stateCard = document.getElementById("panel-state");
const preview = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? new URLSearchParams(location.search).get("preview") : null;
let recipe;
let recipeTabId;
let requestId = 0;

const stateCopy = {
  loading: ["Reading page", "Looking for ingredients and instructions.", "✳"],
  parser: ["Trying website parser", "The page did not include a complete recipe. Checking the website parser.", "✳"],
  "no-recipe": ["No recipe found", "We could not find ingredients and instructions on this page.", "⌕"],
  "access-error": ["Page access needed", "Click the Keep & Cook toolbar icon on this recipe page, then try again. Chrome limits access to some pages and PDFs.", "↗"],
  "extraction-error": ["Could not read this recipe", "The website parser is unavailable. Try again or add the recipe manually.", "!"],
};

function showState(kind, { domain = "", message = "" } = {}) {
  stateCard.dataset.state = kind;
  const loading = kind === "loading" || kind === "parser";
  document.getElementById("recipe").hidden = true;
  stateCard.hidden = false;
  document.getElementById("skeleton").hidden = !loading;
  document.getElementById("state-copy").hidden = loading;
  document.getElementById("refresh").hidden = loading;
  document.getElementById("manual-link").hidden = loading || kind === "access-error";
  const [title, description, icon] = stateCopy[kind] || stateCopy["extraction-error"];
  document.getElementById("loading-label").textContent = title;
  document.getElementById("state-title").textContent = title;
  document.getElementById("state-description").textContent = message || description;
  document.getElementById("state-icon").textContent = icon;
  document.getElementById("state-domain").textContent = domain;
  status.textContent = `${title}. ${message || description}`;
}

function showSaveFeedback(kind, url = "") {
  const messages = {
    handoff: "Review in the opened tab. This recipe has not been saved yet.",
    "signed-out": "Sign in on Keep & Cook to save.",
    "signed-in": "Review and save in your library.",
    "already-saved": "Already saved",
    saved: "Saved to your library",
  };
  const feedback = document.getElementById("save-feedback");
  feedback.textContent = messages[kind] || "";
  feedback.hidden = !messages[kind];
  stateCard.dataset.state = kind;
  if (url && new URL(url).origin === appOrigin && kind !== "handoff") {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = kind === "saved" ? "Open in library ↗" : kind === "already-saved" ? "Open saved recipe ↗" : "Continue in web ↗";
    feedback.append(document.createElement("br"), link);
  }
  status.textContent = messages[kind] || "";
}

function render() {
  document.getElementById("title").textContent = recipe.title;
  document.getElementById("description").textContent = recipe.description;
  document.getElementById("meta").textContent = [recipe.totalTime, recipe.servings].filter(Boolean).join(" · ");
  const source = document.getElementById("source");
  source.href = recipe.sourceUrl;
  source.textContent = new URL(recipe.sourceUrl).hostname;
  const photo = document.getElementById("photo");
  photo.hidden = true;
  photo.removeAttribute("src");
  if (recipe.imageUrl && /^(https:|data:image\/webp;base64,)/.test(recipe.imageUrl)) {
    photo.referrerPolicy = "no-referrer";
    photo.onload = () => { photo.hidden = false; };
    photo.onerror = () => { photo.hidden = true; };
    photo.src = recipe.imageUrl;
  }
  renderIngredients(document.getElementById("ingredients"), recipe.ingredients);
  document.getElementById("steps").replaceChildren(...recipe.steps.map((step) => {
    const item = document.createElement("li");
    item.textContent = step.text;
    return item;
  }));
  document.getElementById("ingredient-count").textContent = `${recipe.ingredients.length} items`;
  document.getElementById("partial-warning").hidden = !recipe.partial;
  document.getElementById("save-feedback").hidden = true;
  document.getElementById("recipe").hidden = false;
  stateCard.hidden = true;
  stateCard.dataset.state = "found";
  document.getElementById("refresh").hidden = true;
  status.textContent = `Recipe found: ${recipe.title}`;
}

async function readPage() {
  const currentRequest = ++requestId;
  recipe = null;
  recipeTabId = undefined;
  showState("loading");
  let pageDomain = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentRequest !== requestId) return;
    if (!tab?.id || !/^https?:\/\//.test(tab.url ?? "")) throw Object.assign(new Error("Open a recipe website and click the toolbar icon to read it."), { kind: "access-error" });
    pageDomain = new URL(tab.url).hostname;
    let extracted;
    try {
      const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["extract.js"] });
      extracted = result.result;
    } catch {
      throw Object.assign(new Error("Click the Keep & Cook toolbar icon on this page to grant access, then try again."), { kind: "access-error" });
    }
    if (!extracted) {
      if (currentRequest !== requestId) return;
      showState("parser", { domain: pageDomain });
      let response;
      try {
        response = await fetch(`${appOrigin}/api/recipes/import`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: tab.url }), signal: AbortSignal.timeout(35000), credentials: "omit",
        });
      } catch {
        throw Object.assign(new Error("Check your connection, then try again."), { kind: "extraction-error" });
      }
      if (currentRequest !== requestId) return;
      let payload;
      try { payload = await response.json(); } catch { payload = {}; }
      if (!response.ok) {
        if (response.status === 404 || response.status === 422) throw Object.assign(new Error("This page has no recipe we can read. You can add it manually on the web."), { kind: "no-recipe" });
        const message = response.status === 429 ? "Too many requests. Wait a moment and try again." : response.status === 400 ? "This website does not allow recipe import, or its page format is unsupported. Try another page." : response.status >= 500 ? "The website parser is temporarily unavailable. Try again shortly." : "This recipe could not be extracted. Try another page or add it manually.";
        throw Object.assign(new Error(message), { kind: "extraction-error" });
      }
      extracted = payload;
    }
    if (currentRequest !== requestId) return;
    if (!extracted?.title || !extracted?.ingredients?.length || !extracted?.steps?.length) throw Object.assign(new Error("This page has no complete recipe we can read."), { kind: "no-recipe" });
    recipe = extracted;
    recipeTabId = tab.id;
    render();
  } catch (error) {
    if (currentRequest === requestId) showState(error.kind || "extraction-error", { domain: pageDomain, message: error.kind ? error.message : "The page could not be read. Try again shortly." });
  }
}

document.getElementById("refresh").addEventListener("click", readPage);
if (!preview) {
  chrome.tabs.onActivated.addListener(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith(`${appOrigin}/`) || tab?.url?.startsWith(chrome.runtime.getURL(""))) {
      if (["handoff", "signed-out", "signed-in", "already-saved", "saved"].includes(stateCard.dataset.state)) return;
      ++requestId;
      recipe = null;
      recipeTabId = undefined;
      showState("access-error", { message: "Open a recipe website and click the toolbar icon to read it." });
      return;
    }
    void readPage();
  });
  chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (tab.active && change.status === "complete" && !tab.url?.startsWith(`${appOrigin}/`) && !tab.url?.startsWith(chrome.runtime.getURL(""))) void readPage();
  });
}
document.getElementById("download").addEventListener("click", (event) => {
  event?.preventDefault?.();
  if (preview) return;
  if (!recipe) return;
  const url = URL.createObjectURL(new Blob([recipeText(recipe)], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${recipe.title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "recipe"}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
});
document.getElementById("save").addEventListener("click", async () => {
  if (preview) return;
  if (!recipe) return;
  try {
    await chrome.tabs.create({ url: libraryUrl(recipe) });
    showSaveFeedback("handoff");
  } catch {
    const feedback = document.getElementById("save-feedback");
    feedback.hidden = false;
    feedback.textContent = "Could not open Keep & Cook. Please try again.";
    status.textContent = feedback.textContent;
  }
});
document.getElementById("cook").addEventListener("click", async () => {
  if (preview) return;
  if (!recipe) return;
  const snapshot = recipe;
  const tabId = recipeTabId;
  const button = document.getElementById("cook");
  button.disabled = true;
  try {
    const css = await readerStyles();
    await chrome.scripting.executeScript({ target: { tabId }, files: ["reader-utils.js", "reader.js"] });
    await chrome.scripting.executeScript({ target: { tabId }, func: (payload, styles) => globalThis.keepAndCookOpenReader(payload, styles), args: [snapshot, css] });
    await chrome.tabs.update(tabId, { active: true });
    window.close();
  } catch {
    try {
      const id = crypto.randomUUID();
      await chrome.storage.session.set({ [`cooking:${id}`]: snapshot });
      await chrome.tabs.create({ url: chrome.runtime.getURL(`cooking.html#${id}`) });
      const feedback = document.getElementById("save-feedback");
      feedback.hidden = false;
      feedback.textContent = "This site blocks overlays. Cooking opened in a new tab.";
    } catch { status.textContent = "Could not open cooking mode. Please try again."; }
  } finally { button.disabled = false; }
});
if (preview) {
  const sample = {
    title: "Lemon & herb roast chicken", description: "A simple Sunday roast with crisp skin, soft potatoes and a bright pan sauce.",
    sourceUrl: "https://example.com/recipes/lemon-herb-chicken", totalTime: "1 hr 15 min", servings: "4 servings",
    ingredients: [
      { name: "whole chicken", amount: "1", unit: "kg" }, { name: "potatoes", amount: "600", unit: "g" },
      { name: "lemons", amount: "2" }, { name: "fresh thyme", amount: "4", unit: "sprigs" },
      { name: "olive oil", amount: "2", unit: "tbsp" }, { name: "sea salt", amount: "1", unit: "tsp" },
    ],
    steps: [
      { text: "Heat the oven to 200°C. Pat the chicken dry and season all over." },
      { text: "Toss the potatoes with olive oil, salt and thyme. Place around the chicken." },
      { text: "Roast for 60 minutes, then rest for 15 minutes before serving." },
    ],
  };
  if (new URLSearchParams(location.search).get("theme") === "dark") document.documentElement.classList.add("dark");
  if (preview === "loading" || preview === "parser") showState(preview, { domain: "example.com" });
  else if (["no-recipe", "access-error", "extraction-error"].includes(preview)) showState(preview, { domain: "example.com" });
  else {
    recipe = sample;
    render();
    if (["handoff", "signed-out", "signed-in", "already-saved", "saved"].includes(preview)) showSaveFeedback(preview, "https://keepandcook.com/dashboard");
  }
} else {
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");
  void readPage();
}
