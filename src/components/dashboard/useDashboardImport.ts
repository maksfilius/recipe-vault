"use client";

import { useEffect, useRef } from "react";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";
import { readRecipeTransfer } from "@/src/lib/recipe-import-transfer";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import type { ImportedRecipe, RecipeCollection } from "@/src/types/recipe";
import type { RecipeFormInitialValue } from "./recipe/RecipeForm";

export type DraftRecipe = RecipeFormInitialValue;
export type AddRecipeMode = "select" | "manual";
type DraftRecipeInput = Partial<ImportedRecipe> & { collectionIds?: string[] };
type Notice = { type: "success" | "error"; message: string };

export function createDraftRecipe(partial: DraftRecipeInput | undefined, collections: RecipeCollection[]): DraftRecipe {
  const requestedIds = new Set(partial?.collectionIds ?? []);
  const suggestedName = partial?.suggestedCollection?.toLocaleLowerCase();
  const selectedCollections = collections.filter((collection) =>
    requestedIds.has(collection.id) ||
    (suggestedName && collection.name.toLocaleLowerCase() === suggestedName));

  return {
    id: `draft-import-${globalThis.crypto.randomUUID()}`,
    title: partial?.title ?? "",
    description: partial?.description ?? "",
    ingredients: partial?.ingredients ?? [],
    steps: partial?.steps ?? [],
    collections: selectedCollections,
    tags: partial?.tags ?? [],
    sourceUrl: partial?.sourceUrl,
    imageUrl: partial?.imageUrl,
    totalTime: partial?.totalTime,
    servings: partial?.servings,
    suggestedCollection: partial?.suggestedCollection,
  };
}

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
      if (importDraftId) setNotice({ type: "error", message: "Recipe draft unavailable or expired. Choose Save to library in the extension again." });
      hasRestoredImport.current = true;
      return;
    }
    if (!storedImport) return;
    hasRestoredImport.current = true;

    try {
      const parsedImport = recipePayloadSchema.safeParse(JSON.parse(storedImport));
      if (!parsedImport.success) {
        setNotice({ type: "error", message: "The recipe preview expired. Import the link again." });
        return;
      }
      setEditingRecipe(createDraftRecipe(parsedImport.data, collections));
      setAddRecipeMode("manual");
      setIsDialogOpen(true);
      setNotice({ type: "success", message: "Recipe imported. Review and save it." });
    } catch {
      setNotice({ type: "error", message: "The recipe preview could not be restored." });
    } finally {
      if (!importDraftId) window.sessionStorage.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    }
  }, [collections, isLoading, importDraftId, userId, setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen]);
}
