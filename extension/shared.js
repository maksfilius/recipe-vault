// The only place the extension names the website. For a local build see README.
export const APP_ORIGIN = "https://keepandcook.com";

export function renderIngredients(container, ingredients) {
  container.replaceChildren(...ingredients.map((ingredient) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const name = document.createElement("span");
    name.textContent = [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
    label.append(checkbox, name);
    item.append(label);
    return item;
  }));
}

export function formatServingsLabel(value) {
  const trimmed = String(value ?? "").trim();
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed} servings` : value;
}

export function recipeText(recipe) {
  return [recipe.title, recipe.sourceUrl, [recipe.totalTime, recipe.servings && formatServingsLabel(recipe.servings)].filter(Boolean).join(" · "), recipe.description, "", "Ingredients", ...recipe.ingredients.map((ingredient) => [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ")), "", "Method", ...recipe.steps.map((step, index) => `${index + 1}. ${step.text}`)].join("\n");
}

export function libraryUrl(recipe) {
  const payload = { ...recipe };
  // The website downloads the photo on Save; a data: preview from the server fallback is too large for a link.
  if (!/^https:\/\//.test(payload.imageUrl ?? "") || payload.imageUrl.length > 2048) delete payload.imageUrl;
  const hash = encodeURIComponent(JSON.stringify(payload));
  if (hash.length > 180000) throw new Error("This recipe is too large to transfer. Download it instead.");
  return `${APP_ORIGIN}/login#keep-and-cook-import=${hash}`;
}

export async function readerStyles() {
  const css = await (await fetch(chrome.runtime.getURL("reader.css"))).text();
  try {
    const font = await (await fetch(chrome.runtime.getURL("Fraunces-Variable.woff2"))).blob();
    const fontUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(font);
    });
    return css.replace("KC_FRAUNCES_URL", fontUrl);
  } catch {
    return css.replace('url("KC_FRAUNCES_URL")', 'local("Georgia")');
  }
}
