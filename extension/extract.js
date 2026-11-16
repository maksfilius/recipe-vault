(() => {
  const text = (value, preserveBreaks = false) => {
    let normalized = String(value ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|li|ol|p|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
    if (normalized.includes("&")) {
      const element = document.createElement("textarea");
      for (let pass = 0; pass < 2; pass += 1) {
        element.innerHTML = normalized;
        const decoded = element.textContent ?? "";
        if (decoded === normalized) break;
        normalized = decoded;
      }
    }
    normalized = normalized.replace(/\u00a0/g, " ");
    return preserveBreaks ? normalized : normalized.replace(/\s+/g, " ").trim();
  };
  const instructions = (value) => {
    if (Array.isArray(value)) return value.flatMap(instructions);
    if (typeof value === "string") return text(value, true).split(/\n+/)
      .map((line) => line.replace(/(\p{Ll}[.!?])(?=\p{Lu})/gu, "$1 ").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (!value || typeof value !== "object") return [];
    return value.itemListElement ? instructions(value.itemListElement) : instructions(value.text);
  };
  const candidates = [];
  const visit = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 30) return;
    if (Array.isArray(value)) return value.forEach((entry) => visit(entry, depth + 1));
    const types = [value["@type"]].flat();
    if (types.some((type) => /(?:^|[/#])Recipe$/i.test(String(type)))) candidates.push(value);
    Object.values(value).forEach((entry) => visit(entry, depth + 1));
  };
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { visit(JSON.parse(script.textContent)); } catch { continue; }
  }
  const score = (recipe) => (recipe.recipeIngredient?.length ?? 0) + instructions(recipe.recipeInstructions).length;
  candidates.sort((first, second) => score(second) - score(first));
  for (const recipe of candidates) {
    const ingredients = [recipe.recipeIngredient ?? []].flat().map(text).filter(Boolean);
    const steps = instructions(recipe.recipeInstructions);
    if (!ingredients.length || !steps.length || !text(recipe.name)) continue;
    const rawImage = [recipe.image].flat()[0];
    let imageUrl;
    try {
      if (!rawImage) throw new Error("No recipe image.");
      const image = new URL(typeof rawImage === "object" ? rawImage?.url : rawImage, location.href);
      if (image.protocol === "https:") imageUrl = image.href;
    } catch { imageUrl = undefined; }
    return {
      title: text(recipe.name).slice(0, 160),
      description: text(recipe.description).slice(0, 5000) || `Recipe from ${location.hostname}`,
      ingredients: ingredients.slice(0, 100).map((name, index) => ({ id: `ingredient-${index}`, name: name.slice(0, 200) })),
      steps: steps.slice(0, 100).map((step, index) => ({ id: `step-${index}`, text: step.slice(0, 5000) })),
      sourceUrl: location.href,
      imageUrl,
      totalTime: text(recipe.totalTime).replace(/^PT/, "").toLowerCase().slice(0, 80),
      servings: text([recipe.recipeYield ?? ""].flat().join(" · ")).slice(0, 80),
      tags: [],
    };
  }
  return null;
})();
