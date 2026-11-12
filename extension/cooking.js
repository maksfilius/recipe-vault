import "./reader.js";
import { readerStyles } from "./shared.js";

try {
  const key = `cooking:${location.hash.slice(1)}`;
  const recipe = (await chrome.storage.session.get(key))[key];
  if (!recipe?.steps?.length) throw new Error("Recipe unavailable. Open cooking mode again from the recipe panel.");
  const css = await readerStyles();
  globalThis.keepAndCookOpenReader(recipe, css);
  document.getElementById("status").textContent = "Cooking closed. You can close this tab or reload to return to the recipe.";
} catch (error) { document.getElementById("status").textContent = error.message; }
