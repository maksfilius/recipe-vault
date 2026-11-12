"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { RecipeFormValues } from "@/src/lib/recipe-form-conversion";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import { toSaveRecipeRpcArgs } from "@/src/lib/save-recipe-args";
import { mapRowToRecipe, type RecipeRow } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";
import { removeRecipeTransfer } from "@/src/lib/recipe-import-transfer";
import type { ImportedRecipe, Recipe } from "@/src/types/recipe";
import { useDashboardImport, createDraftRecipe, isDraftImportedRecipe, type DraftRecipe, type AddRecipeMode } from "./useDashboardImport";
import type { useDashboardData } from "./useDashboardData";

type Notice = { type: "success" | "error"; message: string };

export function useDashboardActions({ data, importDraftId, setImportDraftId }: {
  data: ReturnType<typeof useDashboardData>;
  importDraftId: string | null;
  setImportDraftId: Dispatch<SetStateAction<string | null>>;
}) {
  const router = useRouter();
  const { userId, allRecipes, setAllRecipes, collections, isLoading, isOfflineMode } = data;
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<DraftRecipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addRecipeMode, setAddRecipeMode] = useState<AddRecipeMode>("select");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [importError, setImportError] = useState("");

  useDashboardImport({ isLoading, userId, importDraftId, collections, setNotice, setEditingRecipe, setAddRecipeMode, setIsDialogOpen });
  useEffect(() => {
    if (isLoading || importDraftId) return;
    const url = new URL(window.location.href);
    const addMode = url.searchParams.get("add");
    if (addMode !== "manual" && addMode !== "select") return;
    url.searchParams.delete("add");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before adding a recipe." });
      return;
    }
    setEditingRecipe(null);
    setAddRecipeMode(addMode);
    setIsDialogOpen(true);
  }, [isLoading, importDraftId, isOfflineMode]);
  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const handleAddRecipe = () => {
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before adding a recipe." });
      return;
    }
    setEditingRecipe(null);
    setAddRecipeMode("select");
    setImportUrl("");
    setImportError("");
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before editing a recipe." });
      return;
    }
    setEditingRecipe(recipe);
    setAddRecipeMode("manual");
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setAddRecipeMode("select");
      setImportUrl("");
      setImportError("");
      setEditingRecipe(null);
    }
  };

  const handleDeleteRecipe = async () => {
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before deleting a recipe." });
      return;
    }
    if (!recipeToDelete) return;
    const id = recipeToDelete.id;
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      setNotice({ type: "error", message: "Failed to delete recipe." });
      return;
    }

    setAllRecipes((current) => current.filter((recipe) => recipe.id !== id));
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
    setRecipeToDelete(null);
    setNotice({ type: "success", message: "Recipe deleted." });
  };

  const persistRecipeImage = async (imageUrl?: string) => {
    if (!imageUrl) return undefined;

    const response = await fetch("/api/recipes/images", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { imageUrl?: string; error?: string }
      | null;

    if (!response.ok || !payload?.imageUrl) {
      throw new Error(payload?.error ?? "The recipe image could not be saved.");
    }
    return payload.imageUrl;
  };

  const handleFormSubmit = async (values: RecipeFormValues) => {
    if (isSavingRecipe) return;
    const parsedValues = recipePayloadSchema.safeParse(values);
    if (!parsedValues.success) {
      setNotice({
        type: "error",
        message: parsedValues.error.issues[0]?.message ?? "Recipe data is invalid.",
      });
      return;
    }
    setIsSavingRecipe(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotice({ type: "error", message: "User is not authenticated." });
        router.replace("/login");
        return;
      }

      const isUpdate = Boolean(editingRecipe && !isDraftImportedRecipe(editingRecipe));
      if (parsedValues.data.sourceUrl) {
        const { data: duplicate } = await supabase.from("recipes").select("id")
          .eq("user_id", user.id).eq("source_url", parsedValues.data.sourceUrl).maybeSingle();
        if (duplicate && duplicate.id !== (isUpdate ? editingRecipe?.id : null)) {
          const existing = allRecipes.find((recipe) => recipe.id === duplicate.id);
          if (existing) {
            setSelectedRecipe(existing);
            handleDialogOpenChange(false);
            setNotice({ type: "success", message: "This source link is already saved. Open the recipe to edit it." });
          } else {
            setNotice({ type: "error", message: "This source link is already saved. Refresh the library to open it." });
          }
          return;
        }
      }

      let imageUrl: string | undefined;
      try {
        imageUrl = isUpdate && parsedValues.data.imageUrl === editingRecipe?.imageUrl
          ? parsedValues.data.imageUrl
          : await persistRecipeImage(parsedValues.data.imageUrl);
      } catch (error) {
        setNotice({ type: "error", message: error instanceof Error ? error.message : "The recipe image could not be saved." });
        return;
      }

      const recipeId = isUpdate ? editingRecipe!.id : globalThis.crypto.randomUUID();
      const selectedCollections = collections.filter((collection) => parsedValues.data.collectionIds.includes(collection.id));
      const { data, error } = await supabase.rpc("save_recipe", toSaveRecipeRpcArgs(parsedValues.data, recipeId, imageUrl));
      const savedRow = (Array.isArray(data) ? data[0] : data) as RecipeRow | null;
      if (error || !savedRow) {
        setNotice({ type: "error", message: error?.code === "23505"
          ? "This source link is already saved in your cookbook."
          : "Failed to save recipe. Try again." });
        return;
      }

      const saved = mapRowToRecipe(savedRow, selectedCollections);
      if (importDraftId && isDraftImportedRecipe(editingRecipe)) {
        try { removeRecipeTransfer(window.localStorage, importDraftId); } catch {}
        setImportDraftId(null);
      }
      setAllRecipes((current) => isUpdate
        ? current.map((recipe) => (recipe.id === saved.id ? saved : recipe))
        : [saved, ...current]);
      setSelectedRecipe(saved);
      setNotice({ type: "success", message: isUpdate ? "Recipe updated." : "Recipe created." });
      handleDialogOpenChange(false);
    } catch {
      setNotice({ type: "error", message: "Failed to save recipe. Check your connection and try again." });
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleImportRecipe = async () => {
    if (isImportingRecipe) return;
    const normalizedUrl = importUrl.trim();
    if (!normalizedUrl) {
      setImportError("Paste a recipe URL first.");
      return;
    }

    setIsImportingRecipe(true);
    setImportError("");
    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Partial<ImportedRecipe> & { error?: string })
        | null;
      if (!response.ok) {
        setImportError(payload?.error ?? "Failed to import this link. Try again or add it manually.");
        return;
      }
      const parsedPayload = recipePayloadSchema.partial().safeParse(payload);
      if (!parsedPayload.success) {
        setImportError("We could not read the recipe preview. Add it manually and keep the link.");
        return;
      }

      setEditingRecipe(createDraftRecipe({ ...parsedPayload.data, sourceUrl: parsedPayload.data.sourceUrl ?? normalizedUrl }, collections));
      setAddRecipeMode("manual");
      setNotice({ type: "success", message: "Recipe imported. Review and save it." });
    } catch {
      setImportError("Could not reach the import service. Try again or add it manually.");
    } finally {
      setIsImportingRecipe(false);
    }
  };

  return {
    selectedRecipe, setSelectedRecipe, editingRecipe, isDialogOpen, addRecipeMode, setAddRecipeMode,
    notice, setNotice, recipeToDelete, setRecipeToDelete,
    importUrl, setImportUrl, isImportingRecipe, importError, isSavingRecipe,
    handleAddRecipe, handleEditRecipe, handleDialogOpenChange, handleDeleteRecipe,
    handleFormSubmit, handleImportRecipe,
  };
}
