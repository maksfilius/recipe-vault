export const PENDING_RECIPE_IMPORT_STORAGE_KEY = "keep-and-cook:pending-recipe-import";
// Set to "extension" by extension/library-handoff.js next to the pending recipe, so analytics can
// tell the extension handoff from the landing preview, which share the same pending key.
export const PENDING_RECIPE_SOURCE_STORAGE_KEY = "keep-and-cook:pending-recipe-source";

export function readPendingRecipeSource(): "extension" | null {
  try { return window.sessionStorage.getItem(PENDING_RECIPE_SOURCE_STORAGE_KEY) === "extension" ? "extension" : null; } catch { return null; }
}
