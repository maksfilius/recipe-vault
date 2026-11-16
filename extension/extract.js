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
  // Microdata becomes a JSON-LD-shaped candidate, so one code path builds the result. Like the
  // server parser, all Recipe scopes on the page merge into one (sites split a dish into parts).
  const value = (element) => element.getAttribute("content") ?? element.getAttribute("src") ?? element.textContent;
  const scopes = [...document.querySelectorAll('[itemscope][itemtype*="schema.org/Recipe" i]')];
  const all = (selector) => scopes.flatMap((scope) => [...scope.querySelectorAll(selector)]);
  const first = (prop) => { const element = all(`[itemprop~="${prop}"]`)[0]; return element ? value(element) : undefined; };
  if (scopes.length) {
    const instructionNodes = all('[itemprop~="recipeInstructions"]');
    candidates.push({
      name: first("name"),
      description: first("description"),
      recipeIngredient: all('[itemprop~="recipeIngredient"], [itemprop~="ingredients"]').map(value),
      // h-recipe's e-instructions covers Jetpack recipes, which omit itemprop="recipeInstructions".
      recipeInstructions: (instructionNodes.length ? instructionNodes : all(".e-instructions")).flatMap((element) => {
        const parts = [...element.querySelectorAll('[itemprop~="text"], li, p')].map(value);
        return parts.length ? parts : [value(element)];
      }),
      image: first("image"),
      totalTime: first("totalTime"),
      prepTime: first("prepTime"),
      cookTime: first("cookTime"),
      recipeYield: first("recipeYield"),
    });
  }
  // Same rules as formatDuration/combineDurations/formatServings in src/lib/recipe-import-parser.ts.
  const minutes = (raw) => {
    const match = text(raw).match(/^P(?:(\d+(?:[.,]\d+)?)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?)?$/i);
    if (!match) return null;
    const [days, hours, mins] = match.slice(1).map((part) => Number((part ?? "0").replace(",", ".")));
    return days * 1440 + hours * 60 + mins;
  };
  const formatMinutes = (total) => {
    const days = Math.floor(total / 1440);
    const hours = Math.floor((total - days * 1440) / 60);
    const rest = Math.round((total - days * 1440 - hours * 60) * 100) / 100;
    return [days && `${days} d`, hours && `${hours} hr`, rest && `${rest} min`].filter(Boolean).join(" ");
  };
  const firstText = (raw) => text([raw ?? ""].flat()[0]);
  const duration = (raw) => {
    const value = firstText(raw);
    if (!value) return "";
    const parsed = minutes(value);
    return parsed === null ? value.slice(0, 40) : formatMinutes(parsed);
  };
  const totalTime = (recipe) => {
    if (firstText(recipe.totalTime)) return duration(recipe.totalTime);
    const parts = [recipe.prepTime, recipe.cookTime].map(firstText).filter(Boolean);
    const parsed = parts.map(minutes);
    if (parts.length && parsed.every((part) => part !== null)) return formatMinutes(parsed.reduce((sum, part) => sum + part, 0));
    return duration(recipe.cookTime ?? recipe.prepTime);
  };
  const servings = (raw) => {
    const value = firstText(raw);
    return /^\d+(?:[.,]\d+)?$/.test(value) ? `${value} servings` : value.slice(0, 40);
  };
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
      totalTime: totalTime(recipe),
      servings: servings(recipe.recipeYield),
      tags: [],
    };
  }
  return null;
})();
