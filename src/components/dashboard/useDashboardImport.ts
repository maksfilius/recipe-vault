"use client";

import { useEffect, useRef } from "react";
import { HANDOFF_FAILED_MESSAGE, PENDING_RECIPE_IMPORT_STORAGE_KEY, PENDING_RECIPE_SOURCE_STORAGE_KEY, readPendingRecipeSource, takePendingRecipeError } from "@/src/lib/pending-recipe-import";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import type { RecipeCollection } from "@/src/types/recipe";
import type { RecipeFormInitialValue } from "./recipe/RecipeForm";
import { createDraftRecipe } from "@/src/lib/create-draft-recipe";
import { trackAnalytics } from "@/src/lib/analytics";

export { createDraftRecipe } from "@/src/lib/create-draft-recipe";

export type DraftRecipe = RecipeFormInitialValue;
export type AddRecipeMode = "select" | "manual";
type Notice = { type: "success" | "error"; message: string };

export function isDraftImportedRecipe(recipe: DraftRecipe | null) {
  return Boolean(recipe?.id.startsWith("draft-import-"));
}

// Opens the editor with a recipe staged in sessionStorage by the landing preview or the extension.
export function useDashboardImport({
  isLoading, userId, collections,
  setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen, setDraftSource,
}: {
  isLoading: boolean;
  userId: string;
  collections: RecipeCollection[];
  setNotice: (notice: Notice | null) => void;
  setEditingRecipe: (recipe: DraftRecipe | null) => void;
  setAddRecipeMode: (mode: AddRecipeMode) => void;
  setIsDialogOpen: (open: boolean) => void;
  setDraftSource: (source: "extension" | null) => void;
}) {
  const hasRestoredImport = useRef(false);

  useEffect(() => {
    if (isLoading || !userId || hasRestoredImport.current) return;
    if (takePendingRecipeError()) {
      trackAnalytics("extension_handoff_failed", { reason: "unknown" });
      setNotice({ type: "error", message: HANDOFF_FAILED_MESSAGE });
      return;
    }
    let storedImport: string | null = null;
    try { storedImport = window.sessionStorage.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY); } catch { return; }
    if (!storedImport) return;
    hasRestoredImport.current = true;
    const source = readPendingRecipeSource();

    try {
      const parsedImport = recipePayloadSchema.safeParse(JSON.parse(storedImport));
      if (!parsedImport.success) {
        if (source) trackAnalytics("extension_handoff_failed", { reason: "invalid_url" });
        setNotice({ type: "error", message: source ? HANDOFF_FAILED_MESSAGE : "The recipe preview expired. Import the link again." });
        return;
      }
      setEditingRecipe(createDraftRecipe(parsedImport.data, collections));
      setDraftSource(source);
      setAddRecipeMode("manual");
      setIsDialogOpen(true);
      setNotice({ type: "success", message: "Recipe imported. Review and save it." });
      if (source) trackAnalytics("extension_handoff_completed");
    } catch {
      if (source) trackAnalytics("extension_handoff_failed", { reason: "unknown" });
      setNotice({ type: "error", message: "The recipe preview could not be restored." });
    } finally {
      try {
        window.sessionStorage.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
        window.sessionStorage.removeItem(PENDING_RECIPE_SOURCE_STORAGE_KEY);
      } catch { /* Nothing left to restore. */ }
    }
  }, [collections, isLoading, userId, setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen, setDraftSource]);
}
