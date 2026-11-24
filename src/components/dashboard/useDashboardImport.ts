"use client";

import { useEffect, useRef } from "react";
import { HANDOFF_FAILED_MESSAGE, PENDING_RECIPE_IMPORT_STORAGE_KEY, PENDING_RECIPE_SOURCE_STORAGE_KEY, readPendingRecipeSource, takePendingRecipeError } from "@/src/lib/pending-recipe-import";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import { EXTENSION_RECOVERY_STORAGE_KEY, readImportDrafts, type ImportDraft } from "@/src/lib/import-draft";
import type { RecipeFormInitialValue } from "./recipe/RecipeForm";
import { createDraftRecipe } from "@/src/lib/create-draft-recipe";
import { trackAnalytics } from "@/src/lib/analytics";

export { createDraftRecipe } from "@/src/lib/create-draft-recipe";

export type DraftRecipe = RecipeFormInitialValue;
export type DraftRecipeInput = Parameters<typeof createDraftRecipe>[0];
export type AddRecipeMode = "select" | "manual";
type Notice = { type: "success" | "error"; message: string };

export function isDraftImportedRecipe(recipe: DraftRecipe | null) {
  return Boolean(recipe?.id.startsWith("draft-import-"));
}

export function draftRecipeToValues(recipe: DraftRecipe): ImportDraft["values"] {
  return {
    title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, steps: recipe.steps,
    collectionIds: recipe.collections.map((collection) => collection.id), tags: recipe.tags,
    sourceUrl: recipe.sourceUrl, imageUrl: recipe.imageUrl, totalTime: recipe.totalTime, servings: recipe.servings,
    suggestedCollection: recipe.suggestedCollection,
  };
}

export function browserLocalStorage() {
  try { return window.localStorage; } catch { return undefined; }
}

// Turns a recipe staged in sessionStorage by the landing preview or the extension into an account draft
// (src/lib/import-draft.ts) and opens it. The staged copy is removed only once the draft is stored, so a
// browser that refuses storage still has it after a reload. Without a staged recipe, drafts kept earlier
// come back, and one that was open in the editor opens again.
export function useDashboardImport({
  isLoading, userId, setNotice, startImportDraft, restoreImportDrafts,
}: {
  isLoading: boolean;
  userId: string;
  setNotice: (notice: Notice | null) => void;
  startImportDraft: (recipe: DraftRecipeInput, source: "extension" | null) => boolean;
  restoreImportDrafts: (drafts: ImportDraft[]) => void;
}) {
  const hasRestoredImport = useRef(false);

  useEffect(() => {
    if (isLoading || !userId || hasRestoredImport.current) return;
    hasRestoredImport.current = true;
    if (takePendingRecipeError()) {
      trackAnalytics("extension_handoff_failed", { reason: "unknown" });
      setNotice({ type: "error", message: HANDOFF_FAILED_MESSAGE });
    }
    const drafts = readImportDrafts(browserLocalStorage(), userId);
    restoreImportDrafts(drafts);

    let storedImport: string | null = null;
    try { storedImport = window.sessionStorage.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY); } catch { return; }
    if (!storedImport) return;
    const source = readPendingRecipeSource();
    // Whether the staged copy may go: the draft is stored, or the staged recipe was unusable.
    let consumed = false;
    try {
      const parsedImport = recipePayloadSchema.safeParse(JSON.parse(storedImport));
      if (!parsedImport.success) {
        if (source) trackAnalytics("extension_handoff_failed", { reason: "invalid_url" });
        setNotice({ type: "error", message: source ? HANDOFF_FAILED_MESSAGE : "The recipe preview expired. Import the link again." });
        consumed = true;
        return;
      }
      consumed = startImportDraft(parsedImport.data, source);
      setNotice(consumed
        ? { type: "success", message: "Recipe imported. Review and save it." }
        : { type: "error", message: "Recipe imported, but this browser can’t keep a draft. Save it before you leave this page." });
      if (source) trackAnalytics("extension_handoff_completed");
    } catch {
      if (source) trackAnalytics("extension_handoff_failed", { reason: "unknown" });
      setNotice({ type: "error", message: "The recipe preview could not be restored." });
    } finally {
      if (consumed) {
        try {
          window.sessionStorage.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
          window.sessionStorage.removeItem(PENDING_RECIPE_SOURCE_STORAGE_KEY);
          // The draft now holds the extension's copy kept across sign-in.
          window.localStorage.removeItem(EXTENSION_RECOVERY_STORAGE_KEY);
        } catch { /* The account draft is already stored. */ }
      }
    }
    // Runs once, when the account and collections are loaded; the callbacks are recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userId]);
}
