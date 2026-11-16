"use client";

import { useEffect, useRef } from "react";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";
import { readRecipeTransfer } from "@/src/lib/recipe-import-transfer";
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

export function useDashboardImport({
  isLoading, userId, importDraftId, collections,
  setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen,
}: {
  isLoading: boolean;
  userId: string;
  importDraftId: string | null;
  collections: RecipeCollection[];
  setNotice: (notice: Notice | null) => void;
  setEditingRecipe: (recipe: DraftRecipe | null) => void;
  setAddRecipeMode: (mode: AddRecipeMode) => void;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const hasRestoredImport = useRef(false);

  useEffect(() => {
    if (isLoading || !userId || hasRestoredImport.current) return;
    let storedImport: string | null = null;
    try {
      storedImport = importDraftId
        ? JSON.stringify(readRecipeTransfer(window.localStorage, importDraftId))
        : window.sessionStorage.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    } catch {
      if (importDraftId) {
        trackAnalytics("extension_handoff_failed", { reason: "handoff_expired" });
        setNotice({ type: "error", message: "Recipe draft unavailable or expired. Choose Save to library in the extension again." });
      }
      hasRestoredImport.current = true;
      return;
    }
    if (!storedImport) return;
    hasRestoredImport.current = true;

    try {
      const parsedImport = recipePayloadSchema.safeParse(JSON.parse(storedImport));
      if (!parsedImport.success) {
        if (importDraftId) trackAnalytics("extension_handoff_failed", { reason: "invalid_url" });
        setNotice({ type: "error", message: "The recipe preview expired. Import the link again." });
        return;
      }
      setEditingRecipe(createDraftRecipe(parsedImport.data, collections));
      setAddRecipeMode("manual");
      setIsDialogOpen(true);
      setNotice({ type: "success", message: "Recipe imported. Review and save it." });
      if (importDraftId) {
        try {
          const authFlag = window.sessionStorage.getItem(`keep-and-cook-handoff-auth:${importDraftId}`);
          window.sessionStorage.removeItem(`keep-and-cook-handoff-auth:${importDraftId}`);
          trackAnalytics("extension_handoff_completed", { ...(authFlag ? { was_authenticated: authFlag === "yes" } : {}) });
        } catch { trackAnalytics("extension_handoff_completed"); }
      }
    } catch {
      if (importDraftId) trackAnalytics("extension_handoff_failed", { reason: "unknown" });
      setNotice({ type: "error", message: "The recipe preview could not be restored." });
    } finally {
      if (!importDraftId) window.sessionStorage.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    }
  }, [collections, isLoading, importDraftId, userId, setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen]);
}
