export const PENDING_RECIPE_IMPORT_STORAGE_KEY = "keep-and-cook:pending-recipe-import";
// Set to "extension" by extension/library-handoff.js next to the pending recipe, so analytics can
// tell the extension handoff from the landing preview, which share the same pending key.
export const PENDING_RECIPE_SOURCE_STORAGE_KEY = "keep-and-cook:pending-recipe-source";

// Set by extension/library-handoff.js when a recipe arrived but could not be read, so the page the
// user lands on can say so instead of showing an empty sign-in form.
export const PENDING_RECIPE_ERROR_STORAGE_KEY = "keep-and-cook:pending-recipe-error";
export const HANDOFF_FAILED_MESSAGE = "We couldn’t bring that recipe over from the extension. Go back to the recipe page and try Save again, or use Download in the extension.";

export function takePendingRecipeError(): boolean {
  try {
    const failed = window.sessionStorage.getItem(PENDING_RECIPE_ERROR_STORAGE_KEY) === "1";
    window.sessionStorage.removeItem(PENDING_RECIPE_ERROR_STORAGE_KEY);
    return failed;
  } catch { return false; }
}

export function readPendingRecipeSource(): "extension" | null {
  try { return window.sessionStorage.getItem(PENDING_RECIPE_SOURCE_STORAGE_KEY) === "extension" ? "extension" : null; } catch { return null; }
}
