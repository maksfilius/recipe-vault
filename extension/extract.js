(() => {
  const text = (value) => {
    const element = document.createElement("div");
    element.innerHTML = String(value ?? "");
    return (element.textContent ?? "").replace(/\s+/g, " ").trim();
  };
  const instructions = (value) => {
    if (Array.isArray(value)) return value.flatMap(instructions);
    if (typeof value === "string") return value.split(/\n+/).map(text).filter(Boolean);
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
