if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  const theme = new URLSearchParams(location.search).get("theme");
  const realMatchMedia = globalThis.matchMedia.bind(globalThis);
  if (theme) globalThis.matchMedia = (query) => ({ ...realMatchMedia(query), matches: theme === "dark" });
  const recipe = {
    title: "Lemon & herb roast chicken",
    description: "A simple Sunday roast.",
    sourceUrl: "https://example.com/recipes/lemon-herb-chicken",
    ingredients: [
      { name: "whole chicken", amount: "1", unit: "kg" }, { name: "potatoes", amount: "600", unit: "g" },
      { name: "lemons", amount: "2" }, { name: "fresh thyme", amount: "4", unit: "sprigs" },
    ],
    steps: [
      { text: "Heat the oven to 200°C. Pat the chicken dry and season all over. Mix the lemon zest with thyme, salt and olive oil, then rub the mixture under the skin. Arrange the potatoes around the chicken and roast for 10 minutes. Turn the tray, spoon over the juices, and roast for another 30 minutes. Continue to baste the chicken while the potatoes turn golden. Check the thickest part of the thigh, then rest the roast before carving. ".repeat(3) },
      { text: "Remove the chicken from the oven and let it rest for 15 minutes. Stir the pan juices with lemon juice." },
      { text: "Carve the chicken and serve with potatoes and pan sauce." },
    ],
  };
  globalThis.chrome ??= {};
  globalThis.chrome.runtime ??= { sendMessage: async () => ({ ok: true }) };
  globalThis.__kcWakePreview = { requests: 0, releases: 0 };
  Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: async () => {
    globalThis.__kcWakePreview.requests += 1;
    return { released: false, release: async function () { this.released = true; globalThis.__kcWakePreview.releases += 1; } };
  } } });
  const css = (await (await fetch("reader.css")).text()).replace("KC_FRAUNCES_URL", "Fraunces-Variable.woff2");
  globalThis.keepAndCookOpenReader(recipe, css);
}
