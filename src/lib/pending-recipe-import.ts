import { createDraftRecipe, draftRecipeToValues } from "./create-draft-recipe.ts";
import { EXTENSION_RECOVERY_STORAGE_KEY, writeImportDraft } from "./import-draft.ts";
import { recipePayloadSchema } from "./recipe-validation.ts";

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

type Storages = { session?: Pick<Storage, "getItem" | "setItem" | "removeItem">; local?: Pick<Storage, "getItem" | "setItem" | "removeItem"> };
export type PendingRecipeBinding = { kind: "none" } | { kind: "bound"; title: string } | { kind: "kept-in-tab"; title: string };

// Sign-up that needs email confirmation: the confirmation link usually opens in a new tab, which cannot
// see this tab's sessionStorage. Moves the staged recipe into the new account's draft store
// (src/lib/import-draft.ts, localStorage, keyed by user id), where /dashboard opens it once that same
// user is signed in, in any tab. The staged copies (this tab's sessionStorage and the extension's
// recovery copy) are removed only after the draft is stored, so the recipe is never in two places that
// could each become a draft. If storing fails, the recipe stays staged in this tab.
export function bindPendingRecipeToAccount(userId: string, storages: Storages, now = Date.now()): PendingRecipeBinding {
  const { session, local } = storages;
  let raw: string | null = null;
  try { raw = session?.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY) ?? null; } catch { return { kind: "none" }; }
  if (!raw || !userId) return { kind: "none" };
  let parsed;
  try { parsed = recipePayloadSchema.safeParse(JSON.parse(raw)); } catch { return { kind: "none" }; }
  if (!parsed.success) return { kind: "none" };
  let source: "extension" | null = null;
  try { source = session?.getItem(PENDING_RECIPE_SOURCE_STORAGE_KEY) === "extension" ? "extension" : null; } catch { /* Unknown source. */ }
  const recipe = createDraftRecipe(parsed.data, []);
  const stored = writeImportDraft(local, userId, { id: recipe.id, values: draftRecipeToValues(recipe), source, open: true, savedAt: now });
  if (!stored) return { kind: "kept-in-tab", title: recipe.title };
  try {
    session?.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    session?.removeItem(PENDING_RECIPE_SOURCE_STORAGE_KEY);
    local?.removeItem(EXTENSION_RECOVERY_STORAGE_KEY);
  } catch { /* The account draft is stored; a leftover copy is matched by source link on the dashboard. */ }
  return { kind: "bound", title: recipe.title };
}
