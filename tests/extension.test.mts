import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { load } from "cheerio";
import { recipePayloadSchema } from "../src/lib/recipe-validation.ts";
import { buildImportedRecipe } from "../src/lib/recipe-import-parser.ts";
import { runExtensionExtract } from "../scripts/run-extension-extract.mjs";
import { recipeText, libraryUrl, formatServingsLabel, APP_ORIGIN } from "../extension/shared.js";

const extractionScript = readFileSync(new URL("../extension/extract.js", import.meta.url), "utf8");
const backgroundScript = readFileSync(new URL("../extension/background.js", import.meta.url), "utf8").replace(/^import .*;\n/, "");

test("side panel keeps only the brand in its header and places retry in the empty state", () => {
  const html = readFileSync(new URL("../extension/sidepanel.html", import.meta.url), "utf8");
  const $ = load(html);
  assert.equal($(".panel-header").children().length, 1);
  assert.equal($("#panel-state #refresh").length, 1);
  assert.equal($("#recipe .actions button").length, 2);
  assert.equal($("#recipe .actions button.primary").text().trim(), "Start cooking →");
  assert.equal($("#recipe .actions button.secondary").text().trim(), "Save");
  assert.equal($("#method + #download").text().trim(), "Download");
});

test("toolbar click opens the panel directly inside the user gesture", async () => {
  let click: ((tab: { windowId: number }) => void) | undefined;
  const opened: unknown[] = [];
  runInNewContext(backgroundScript, {
    console,
    libraryUrl,
    APP_ORIGIN,
    chrome: {
      runtime: { onMessage: { addListener() {} }, onInstalled: { addListener() {} } },
      action: {
        onClicked: { addListener: (listener: typeof click) => { click = listener; } },
        setBadgeText: async () => {},
      },
      sidePanel: {
        open: (options: unknown) => { opened.push(options); return Promise.resolve(); },
        setPanelBehavior: async () => {},
      },
    },
  });
  assert.ok(click);
  click({ windowId: 42 });
  assert.equal(opened.length, 1);
  assert.equal((opened[0] as { windowId: number }).windowId, 42);
  await Promise.resolve();
});

test("standalone cooking tabs can save without a content-script sender tab", async () => {
  let handler: ((message: unknown, sender: unknown, respond: (value: unknown) => void) => void) | undefined;
  let target = "";
  runInNewContext(backgroundScript, {
    console, libraryUrl, APP_ORIGIN,
    chrome: {
      runtime: { id: "test", onMessage: { addListener(listener: typeof handler) { handler = listener; } }, onInstalled: { addListener() {} } },
      action: { onClicked: { addListener() {} } },
      sidePanel: { setPanelBehavior: async () => {} },
      tabs: { create: async ({ url }: { url: string }) => { target = url; } },
    },
  });
  handler?.({ type: "save-recipe", recipe: { title: "Soup" } }, { id: "test" }, () => {});
  await Promise.resolve();
  assert.match(target, /^https:\/\/keepandcook.com\/login#/);
});

test("cooking injects a page reader and saves through the existing login route", async () => {
  const elements = new Map();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, { hidden: false, disabled: false, textContent: "", dataset: {}, addEventListener(event: string, listener: () => void) { this[event] = listener; }, replaceChildren() {}, removeAttribute() {} });
    return elements.get(id);
  };
  const opened: string[] = [];
  const activeTab = { id: 1, url: "https://recipes.example/soup" };
  const injections: { files?: string[]; args?: unknown[] }[] = [];
  let closed = false;
  const recipe = { title: "Soup", description: "Lunch", sourceUrl: "https://recipes.example/soup", servings: "2", ingredients: [{ name: "Carrot" }], steps: [{ text: "Chop." }, { text: "Simmer." }] };
  const script = readFileSync(new URL("../extension/panel.js", import.meta.url), "utf8").replace(/^import .*;\n/, "");
  runInNewContext(script, {
    URL, console, APP_ORIGIN, libraryUrl, formatServingsLabel, readerStyles: async () => "reader styles", renderIngredients() {},
    fetch: async () => ({ text: async () => "reader styles" }),
    window: { close() { closed = true; } },
    navigator: {},
    document: { visibilityState: "visible", getElementById: element, addEventListener() {}, createElement: () => ({}) },
    chrome: {
      tabs: { query: async () => [activeTab], update: async () => {}, create: async ({ url }: { url: string }) => { opened.push(url); }, onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
      runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
      scripting: { executeScript: async (options: { files?: string[]; args?: unknown[] }) => { injections.push(options); return [{ result: recipe }]; } },
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(element("meta").textContent, "2 servings");
  await element("cook").click();
  assert.equal(opened.length, 0);
  assert.equal(closed, true);
  assert.deepEqual(Array.from(injections[1].files ?? []), ["reader-utils.js", "reader.js"]);
  assert.equal(injections[2].args?.[0], recipe);
  closed = false;
  await element("save").click();
  assert.match(opened[0], /^https:\/\/keepandcook.com\/login#keep-and-cook-import=/);
  assert.equal(closed, true, "Save hands the review to the website tab and closes the panel");
});

test("panel separates loading, missing recipe, access, rate limit, and unconfirmed save states", async () => {
  const elements = new Map();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, { hidden: false, textContent: "", dataset: {}, addEventListener(event: string, listener: () => void) { this[event] = listener; }, replaceChildren() {}, removeAttribute() {} });
    return elements.get(id);
  };
  const activeTab = { id: 7, url: "https://example.com/soup" };
  let extraction: "empty" | "denied" | "recipe" = "empty";
  let panelClosed = false;
  let responseStatus = 404;
  const script = readFileSync(new URL("../extension/panel.js", import.meta.url), "utf8").replace(/^import .*;\n/, "");
  runInNewContext(script, {
    URL, console, APP_ORIGIN, libraryUrl, formatServingsLabel, renderIngredients() {}, AbortSignal,
    document: { getElementById: element, createElement: () => ({ textContent: "" }) },
    window: { close() { panelClosed = true; } },
    fetch: async () => ({ ok: false, status: responseStatus, json: async () => ({ error: responseStatus === 429 ? "Rate limited" : "No recipe" }) }),
    chrome: {
      runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
      tabs: { query: async () => [activeTab], create: async () => {}, onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
      scripting: { executeScript: async () => {
        if (extraction === "denied") throw Error("denied");
        return [{ result: extraction === "recipe" ? { title: "Soup", description: "Lunch", sourceUrl: activeTab.url, ingredients: [{ name: "Salt" }], steps: [{ text: "Mix" }] } : null }];
      } },
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(element("panel-state").dataset.state, "no-recipe");
  assert.equal(element("refresh").hidden, false);
  extraction = "denied";
  await element("refresh").click();
  assert.equal(element("panel-state").dataset.state, "access-error");
  assert.equal(element("refresh").hidden, false);
  extraction = "empty";
  responseStatus = 429;
  await element("refresh").click();
  assert.equal(element("panel-state").dataset.state, "extraction-error");
  assert.equal(element("refresh").hidden, false);
  extraction = "recipe";
  await element("refresh").click();
  assert.equal(element("panel-state").dataset.state, "found");
  assert.equal(element("refresh").hidden, true);
  await element("save").click();
  assert.equal(panelClosed, true);
});

function extract(scripts: unknown[]) {
  return runInNewContext(extractionScript, {
    URL,
    location: { href: "https://recipes.example/soup", hostname: "recipes.example" },
    document: {
      querySelectorAll: (selector: string) => selector.includes("ld+json") ? scripts.map((value) => ({ textContent: typeof value === "string" ? value : JSON.stringify(value) })) : [],
      createElement: () => ({
        value: "",
        set innerHTML(value: string) { this.value = load(value).root().text(); },
        get textContent() { return this.value; },
      }),
    },
  });
}

test("extension extracts nested graph recipes and instruction sections into an app-compatible payload", () => {
  const recipe = extract(["invalid JSON", { "@graph": [{ "@type": ["Recipe"], name: "Soup &amp; bread", recipeIngredient: ["2 carrots", "1 onion"], recipeInstructions: [{ "@type": "HowToSection", itemListElement: [{ text: "<b>Chop</b> vegetables." }, { text: "Simmer." }] }], image: { url: "/soup.jpg" }, recipeYield: ["2 servings"] }] }]);
  assert.equal(recipe.title, "Soup & bread");
  assert.equal(recipe.steps.length, 2);
  assert.equal(recipe.steps[0].text, "Chop vegetables.");
  assert.equal(recipe.imageUrl, "https://recipes.example/soup.jpg");
  assert.equal(recipePayloadSchema.safeParse(recipe).success, true);
});

test("extension decodes double escapes and keeps HTML-separated instructions apart", () => {
  const recipe = extract([{
    "@type": "Recipe",
    name: "Fish &amp;amp; Chips",
    description: "A &amp;quot;quick&amp;quot; dinner &quot;today&quot;.",
    recipeIngredient: ["1 cup flour &amp;amp; herbs &amp; spice"],
    recipeInstructions: [{ text: "Don&amp;#39;t rush &amp;amp; stir. Fry immediately.Make sauce.<br>Serve warm.</p><p>It&#39;s ready." }],
  }]);
  assert.equal(recipe.title, "Fish & Chips");
  assert.equal(recipe.description, 'A "quick" dinner "today".');
  assert.equal(recipe.ingredients[0].name, "1 cup flour & herbs & spice");
  assert.deepEqual(Array.from(recipe.steps as { text: string }[], (step) => step.text), [
    "Don't rush & stir. Fry immediately. Make sauce.",
    "Serve warm.",
    "It's ready.",
  ]);
});

test("extension ignores incomplete recipes, handles malformed images, and bounds fields", () => {
  const recipe = extract([{ "@type": "Recipe", name: "Incomplete" }, { "@type": "https://schema.org/Recipe", name: "x".repeat(200), recipeIngredient: ["y".repeat(300)], recipeInstructions: "Mix.\nBake.", image: "javascript:alert(1)" }]);
  assert.equal(recipe.title.length, 160);
  assert.equal(recipe.ingredients[0].name.length, 200);
  assert.equal(recipe.steps.length, 2);
  assert.equal(recipe.imageUrl, undefined);
  assert.equal(recipePayloadSchema.safeParse(recipe).success, true);
  assert.equal(extract([{ "@type": "Article", name: "No recipe" }]), null);
  assert.equal(extract([{ "@type": "Recipe", name: "No picture", recipeIngredient: ["Salt"], recipeInstructions: "Mix." }]).imageUrl, undefined);
});

test("download preserves Unicode, ingredient quantities, instructions, and attribution", () => {
  const output = recipeText({ title: "Суп", description: "Обед", sourceUrl: "https://recipes.example/soup", totalTime: "20 min", servings: "2", ingredients: [{ name: "морковь", amount: "2", unit: "шт" }], steps: [{ text: "Нарезать." }, { text: "Варить." }] });
  assert.match(output, /20 min · 2 servings/);
  assert.match(output, /2 шт морковь/);
  assert.match(output, /2\. Варить\./);
  assert.match(output, /https:\/\/recipes.example\/soup/);
});

test("background opens the welcome page on first install only", () => {
  let installed: ((details: { reason: string }) => void) | undefined;
  const created: string[] = [];
  runInNewContext(backgroundScript, {
    console, libraryUrl, APP_ORIGIN,
    chrome: {
      runtime: { onMessage: { addListener() {} }, onInstalled: { addListener(listener: typeof installed) { installed = listener; } } },
      action: { onClicked: { addListener() {} } },
      sidePanel: { setPanelBehavior: async () => {} },
      tabs: { create: async ({ url }: { url: string }) => { created.push(url); } },
    },
  });
  installed?.({ reason: "update" });
  installed?.({ reason: "chrome_update" });
  assert.deepEqual(created, []);
  installed?.({ reason: "install" });
  assert.deepEqual(created, [`${APP_ORIGIN}/extension/welcome`]);
});

function extractHtml(html: string, href = "https://recipes.example/lemon-chicken") {
  return runExtensionExtract(extractionScript, html, href);
}

test("extension reads microdata recipes the way the server parser does", () => {
  const html = readFileSync(new URL("./fixtures/microdata-recipe.html", import.meta.url), "utf8");
  const local = extractHtml(html);
  const server = buildImportedRecipe(html, "https://recipes.example/lemon-chicken");
  assert.ok(local && server);
  assert.equal(local.title, server.title);
  assert.equal(local.description, server.description);
  assert.deepEqual(Array.from(local.ingredients as { name: string }[], (item) => item.name),
    server.ingredients.map((item) => [item.amount, item.unit, item.name].filter(Boolean).join(" ")));
  assert.deepEqual(Array.from(local.steps as { text: string }[], (step) => step.text), server.steps.map((step) => step.text));
  assert.equal(local.totalTime, "1 hr 15 min");
  assert.equal(local.totalTime, server.totalTime);
  assert.equal(local.servings, "4 servings");
  assert.equal(local.servings, server.servings);
  assert.equal(local.imageUrl, "https://recipes.example/images/lemon-chicken.jpg");
  assert.equal(recipePayloadSchema.safeParse(local).success, true);
});

test("extension formats JSON-LD time and servings like the server", () => {
  const recipe = (fields: Record<string, unknown>) => extract([{ "@type": "Recipe", name: "Soup", recipeIngredient: ["Salt"], recipeInstructions: "Mix.", ...fields }]);
  assert.equal(recipe({ totalTime: "PT1H30M", recipeYield: ["6", "6 bowls"] }).totalTime, "1 hr 30 min");
  assert.equal(recipe({ totalTime: "PT1H30M", recipeYield: ["6", "6 bowls"] }).servings, "6 servings");
  assert.equal(recipe({ prepTime: "PT10M", cookTime: "PT20M" }).totalTime, "30 min");
  assert.equal(recipe({ cookTime: "about an hour" }).totalTime, "about an hour");
  assert.equal(recipe({ recipeYield: "1 loaf" }).servings, "1 loaf");
  assert.equal(recipe({}).totalTime, "");
});

test("extension and server merge recipe parts and read h-recipe instructions", () => {
  const html = `<div itemscope itemtype="https://schema.org/Recipe"><h2 itemprop="name">Roast chicken</h2>
    <ul><li itemprop="recipeIngredient">1 chicken</li></ul><div class="e-instructions"><p>Season the chicken.</p><p>Roast it.</p></div></div>
    <div itemscope itemtype="https://schema.org/Recipe"><h2 itemprop="name">Bread salad</h2>
    <ul><li itemprop="recipeIngredient">1 loaf bread</li></ul><div class="e-instructions"><p>Toast the bread.</p></div></div>`;
  const local = extractHtml(html);
  const server = buildImportedRecipe(html, "https://recipes.example/lemon-chicken");
  assert.ok(server);
  assert.deepEqual(Array.from(local.ingredients as { name: string }[], (item) => item.name), ["1 chicken", "1 loaf bread"]);
  assert.deepEqual(server.ingredients.map((item) => [item.amount, item.unit, item.name].filter(Boolean).join(" ")), ["1 chicken", "1 loaf bread"]);
  const steps = ["Season the chicken.", "Roast it.", "Toast the bread."];
  assert.deepEqual(Array.from(local.steps as { text: string }[], (step) => step.text), steps);
  assert.deepEqual(server.steps.map((step) => step.text), steps);
});

test("extension resolves Yoast photo references and falls back to og:image", () => {
  const base = { "@type": "Recipe", name: "Coleslaw", recipeIngredient: ["1 cabbage"], recipeInstructions: "Slice." };
  const graph = { "@graph": [{ ...base, image: { "@id": "https://recipes.example/coleslaw/#primaryimage" } }, { "@type": "ImageObject", "@id": "https://recipes.example/coleslaw/#primaryimage", url: "https://images.recipes.example/coleslaw.jpg", contentUrl: "https://images.recipes.example/coleslaw.jpg" }] };
  assert.equal(extract([graph]).imageUrl, "https://images.recipes.example/coleslaw.jpg");
  assert.equal(extract([{ ...base, image: { "@type": "ImageObject", contentUrl: "/slaw.jpg" } }]).imageUrl, "https://recipes.example/slaw.jpg");
  const html = `<meta property="og:image" content="https://images.recipes.example/og.jpg"><script type="application/ld+json">${JSON.stringify({ ...base, image: { "@id": "#missing" } })}</script>`;
  assert.equal(extractHtml(html).imageUrl, "https://images.recipes.example/og.jpg");
});

test("save link keeps an https photo for the website to download, but not a data preview", () => {
  const recipe = { title: "Slaw", description: "Side", sourceUrl: "https://recipes.example/slaw", ingredients: [{ id: "a", name: "Cabbage" }], steps: [{ id: "b", text: "Slice." }] };
  const payload = (url: string) => JSON.parse(decodeURIComponent(new URL(url).hash.slice("#keep-and-cook-import=".length)));
  assert.equal(payload(libraryUrl({ ...recipe, imageUrl: "https://images.recipes.example/slaw.jpg" })).imageUrl, "https://images.recipes.example/slaw.jpg");
  assert.equal(payload(libraryUrl({ ...recipe, imageUrl: "data:image/webp;base64,AAAA" })).imageUrl, undefined);
});
