"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeFormValues } from "@/src/lib/recipe-form-conversion";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import { toSaveRecipeRpcArgs } from "@/src/lib/save-recipe-args";
import { mapRowToRecipe, type RecipeRow } from "@/src/lib/recipes";
import { claimFirstCookHint } from "@/src/lib/recipe-details";
import { prepareRecipeImport, resolveExistingRecipe } from "@/src/lib/recipe-import-existing";
import { supabase } from "@/src/lib/supabase-client";
import { trackAnalytics } from "@/src/lib/analytics";
import { getImportSourceKind } from "@/src/lib/analytics-events";
import type { ImportedRecipe, Recipe } from "@/src/types/recipe";
import { clearImportDraft, writeImportDraft, type ImportDraft } from "@/src/lib/import-draft";
import {
  useDashboardImport, browserLocalStorage, createDraftRecipe, draftRecipeToValues, isDraftImportedRecipe,
  type DraftRecipe, type DraftRecipeInput, type AddRecipeMode,
} from "./useDashboardImport";
import type { useDashboardData } from "./useDashboardData";

type Notice = { type: "success" | "error"; message: string };
const SAVED_RECIPE_SELECT = "*, recipe_collections(collection:collections(id,user_id,name,position,created_at))";

async function findSavedRecipeRow(userId: string, sourceUrl: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase.from("recipes").select(SAVED_RECIPE_SELECT)
    .eq("user_id", userId).eq("source_url", sourceUrl).maybeSingle();
  if (error) throw error;
  return (data as RecipeRow | null) ?? null;
}

export function useDashboardActions({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const router = useRouter();
  const { userId, allRecipes, setAllRecipes, collections, isLoading, isOfflineMode } = data;
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [firstCookHintRecipeId, setFirstCookHintRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<DraftRecipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addRecipeMode, setAddRecipeMode] = useState<AddRecipeMode>("select");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [draftSource, setDraftSource] = useState<"extension" | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [importError, setImportError] = useState("");
  // Unsaved imports kept for this account (src/lib/import-draft.ts), the one open in the editor, and the
  // Keep / Discard question asked when the editor of an import is closed.
  const [importDrafts, setImportDrafts] = useState<ImportDraft[]>([]);
  const activeDraft = useRef<ImportDraft | null>(null);
  const [draftStorageFailed, setDraftStorageFailed] = useState(false);
  const [closePrompt, setClosePrompt] = useState<null | "choose" | "discard">(null);

  const persistDraft = (draft: ImportDraft) => {
    const stored = writeImportDraft(browserLocalStorage(), userId, draft);
    setImportDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
    setDraftStorageFailed(!stored);
    return stored;
  };
  const openDraft = (draft: ImportDraft) => {
    activeDraft.current = draft;
    setEditingRecipe({ ...createDraftRecipe(draft.values, collections), id: draft.id });
    setDraftSource(draft.source);
    setAddRecipeMode("manual");
    setImportError("");
    setIsDialogOpen(true);
  };
  /** Opens a new import in the editor; false when the browser could not store it as a draft. */
  const startImportDraft = (payload: DraftRecipeInput, source: "extension" | null) => {
    const recipe = createDraftRecipe(payload, collections);
    const draft: ImportDraft = { id: recipe.id, values: draftRecipeToValues(recipe), source, open: true, savedAt: Date.now() };
    const stored = persistDraft(draft);
    openDraft(draft);
    return stored;
  };
  const restoreImportDrafts = (drafts: ImportDraft[]) => {
    setImportDrafts(drafts);
    const open = drafts.find((draft) => draft.open);
    if (open) openDraft(open);
  };
  // Saved, matched to a recipe already in the library, or discarded: the draft must not come back.
  const finishDraft = (id: string) => {
    if (activeDraft.current?.id === id) activeDraft.current = null;
    setImportDrafts((current) => current.filter((item) => item.id !== id));
    return clearImportDraft(browserLocalStorage(), userId, id);
  };
  const handleDraftChange = (values: RecipeFormValues) => {
    const draft = activeDraft.current;
    if (!draft) return;
    const next = { ...draft, values: { ...values, suggestedCollection: draft.values.suggestedCollection }, savedAt: Date.now() };
    activeDraft.current = next;
    const stored = persistDraft(next);
    if (!stored && !draftStorageFailed) setNotice({ type: "error", message: "This browser can’t keep a draft of your changes. Save the recipe before you leave this page." });
  };
  const continueEditing = (id: string) => {
    const draft = importDrafts.find((item) => item.id === id);
    if (!draft) return;
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before saving a recipe." });
      return;
    }
    const next = { ...draft, open: true, savedAt: Date.now() };
    persistDraft(next);
    openDraft(next);
  };

  // Runs once per page load (guarded inside); the callbacks read current state when it runs.
  useDashboardImport({ isLoading, userId, setNotice, startImportDraft, restoreImportDrafts });
  useEffect(() => {
    if (isLoading) return;
    const url = new URL(window.location.href);
    const addMode = url.searchParams.get("add");
    if (addMode !== "manual" && addMode !== "select") return;
    const sharedUrl = url.searchParams.get("url");
    url.searchParams.delete("add");
    url.searchParams.delete("url");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before adding a recipe." });
      return;
    }
    setEditingRecipe(null);
    setAddRecipeMode(addMode);
    setIsDialogOpen(true);
    if (sharedUrl) {
      setImportUrl(sharedUrl);
      if (addMode === "select") void handleImportRecipe(sharedUrl);
    }
    // Runs once per page load; handleImportRecipe is recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isOfflineMode]);
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
    setFirstCookHintRecipeId(null);
    setEditingRecipe(recipe);
    setAddRecipeMode("manual");
    setIsDialogOpen(true);
  };

  const closeEditor = () => {
    setIsDialogOpen(false);
    setClosePrompt(null);
    setAddRecipeMode("select");
    setImportUrl("");
    setImportError("");
    setEditingRecipe(null);
    setDraftSource(null);
  };

  // An unsaved import never closes silently: Escape and the close button ask to keep or discard it
  // (clicks outside are ignored in DashboardDialogs). Other editors close as before.
  const handleDialogOpenChange = (open: boolean) => {
    if (open) setIsDialogOpen(true);
    else if (isDraftImportedRecipe(editingRecipe)) setClosePrompt("choose");
    else closeEditor();
  };

  const keepDraft = () => {
    const draft = activeDraft.current;
    let stored = false;
    if (draft) {
      // Stays the active draft until the form unmounts, so its last edits are still written.
      activeDraft.current = { ...draft, open: false };
      stored = persistDraft(activeDraft.current);
    }
    closeEditor();
    setNotice(stored
      ? { type: "success", message: "Draft kept. Pick it up again with Continue editing." }
      : { type: "error", message: "This browser can’t store the draft. It stays only until you leave this page." });
  };

  const discardDraft = () => {
    const removed = activeDraft.current ? finishDraft(activeDraft.current.id) : true;
    closeEditor();
    setNotice(removed
      ? { type: "success", message: "Draft discarded." }
      : { type: "error", message: "The draft could not be removed from this browser." });
  };

  const openExistingRecipe = (recipe: Recipe) => {
    setAllRecipes((current) => current.some((item) => item.id === recipe.id)
      ? current.map((item) => item.id === recipe.id ? recipe : item)
      : [recipe, ...current]);
    setFirstCookHintRecipeId(null);
    setSelectedRecipe(recipe);
    trackAnalytics("recipe_opened", { entry_point: "other" });
    if (editingRecipe && isDraftImportedRecipe(editingRecipe)) finishDraft(editingRecipe.id);
    closeEditor();
    setNotice({ type: "success", message: "This recipe is already in your library." });
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
        const existing = await resolveExistingRecipe(parsedValues.data.sourceUrl,
          isUpdate ? editingRecipe?.id ?? null : null,
          (url) => findSavedRecipeRow(user.id, url));
        if (existing) {
          openExistingRecipe(existing);
          return;
        }
      }

      let imageUrl: string | undefined;
      let photoSkipped = false;
      try {
        imageUrl = isUpdate && parsedValues.data.imageUrl === editingRecipe?.imageUrl
          ? parsedValues.data.imageUrl
          : await persistRecipeImage(parsedValues.data.imageUrl);
      } catch {
        // A photo the source site refuses to serve must not block saving the recipe itself.
        photoSkipped = true;
      }

      const recipeId = isUpdate ? editingRecipe!.id : globalThis.crypto.randomUUID();
      const selectedCollections = collections.filter((collection) => parsedValues.data.collectionIds.includes(collection.id));
      const { data, error } = await supabase.rpc("save_recipe", toSaveRecipeRpcArgs(parsedValues.data, recipeId, imageUrl));
      const savedRow = (Array.isArray(data) ? data[0] : data) as RecipeRow | null;
      if (error || !savedRow) {
        if (error?.code === "23505" && parsedValues.data.sourceUrl) {
          const existing = await resolveExistingRecipe(parsedValues.data.sourceUrl,
            isUpdate ? editingRecipe?.id ?? null : null,
            (url) => findSavedRecipeRow(user.id, url));
          if (existing) {
            openExistingRecipe(existing);
            return;
          }
        }
        setNotice({ type: "error", message: "Failed to save recipe. Try again." });
        return;
      }

      const saved = mapRowToRecipe(savedRow, selectedCollections);
      const source = draftSource ?? (parsedValues.data.sourceUrl ? "url" : "manual");
      trackAnalytics(isUpdate ? "recipe_updated" : "recipe_saved", isUpdate
        ? { source } : { source, is_first_recipe: allRecipes.length === 0 });
        setAllRecipes((current) => isUpdate
        ? current.map((recipe) => (recipe.id === saved.id ? saved : recipe))
        : [saved, ...current]);
      try {
        if (claimFirstCookHint(window.localStorage, user.id, allRecipes.length,
          saved.steps.some((step) => step.text.trim().length > 0), isUpdate)) {
          setFirstCookHintRecipeId(saved.id);
        }
      } catch {
        // The saved recipe remains usable when browser storage is unavailable.
      }
      setSelectedRecipe(saved);
      trackAnalytics("recipe_opened", { entry_point: "after_save" });
      setNotice({ type: "success", message: `${isUpdate ? "Recipe updated." : "Recipe created."}${photoSkipped ? " The photo could not be saved." : ""}` });
      if (editingRecipe && isDraftImportedRecipe(editingRecipe)) finishDraft(editingRecipe.id);
      closeEditor();
    } catch {
      setNotice({ type: "error", message: "Failed to save recipe. Check your connection and try again." });
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleImportRecipe = async (urlOverride?: string) => {
    if (isImportingRecipe) return;
    const normalizedUrl = (urlOverride ?? importUrl).trim();
    if (!normalizedUrl) {
      setImportError("Paste a recipe URL first.");
      return;
    }
    if (!userId) {
      setImportError("Sign in to import a recipe.");
      return;
    }

    setIsImportingRecipe(true);
    setImportError("");
    trackAnalytics("url_import_started", { source_kind: getImportSourceKind(normalizedUrl) });
    try {
      const decision = await prepareRecipeImport(normalizedUrl,
        async (url) => {
          try {
            return await findSavedRecipeRow(userId, url);
          } catch {
            throw new Error("Could not check your library. Try again.");
          }
        },
        async (url) => {
          let response: Response;
          try {
            response = await fetch("/api/recipes/import", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ url }),
            });
          } catch {
            throw new Error("Could not reach the import service. Try again or add it manually.");
          }
          const payload = (await response.json().catch(() => null)) as
            | (Partial<ImportedRecipe> & { error?: string })
            | null;
          if (!response.ok) {
            throw new Error(payload?.error ?? "Failed to import this link. Try again or add it manually.");
          }
          const parsedPayload = recipePayloadSchema.partial().safeParse(payload);
          if (!parsedPayload.success) {
            throw new Error("We could not read the recipe preview. Add it manually and keep the link.");
          }
          return parsedPayload.data;
        });
      if (decision.kind === "existing") {
        openExistingRecipe(decision.recipe);
        return;
      }

      const payload = { ...decision.recipe, sourceUrl: decision.recipe.sourceUrl ?? normalizedUrl };
      const stored = startImportDraft(payload, null);
      setNotice(stored
        ? { type: "success", message: "Recipe imported. Review and save it." }
        : { type: "error", message: "Recipe imported, but this browser can’t keep a draft. Save it before you leave this page." });
      trackAnalytics("import_preview_shown", { source_kind: getImportSourceKind(normalizedUrl), has_ingredients: Boolean(payload.ingredients?.length), has_steps: Boolean(payload.steps?.length), has_image: Boolean(payload.imageUrl) });
    } catch (error) {
      trackAnalytics("import_failed", { source: "url", reason: "unknown" });
      setImportError(error instanceof Error ? error.message : "Could not import this recipe. Try again.");
    } finally {
      setIsImportingRecipe(false);
    }
  };

  return {
    selectedRecipe, setSelectedRecipe, firstCookHintRecipeId, setFirstCookHintRecipeId,
    editingRecipe, isDialogOpen, addRecipeMode, setAddRecipeMode,
    notice, setNotice, recipeToDelete, setRecipeToDelete,
    importUrl, setImportUrl, isImportingRecipe, importError, setImportError, isSavingRecipe,
    handleAddRecipe, handleEditRecipe, handleDialogOpenChange, handleDeleteRecipe,
    handleFormSubmit, handleImportRecipe,
    importDrafts, closePrompt, setClosePrompt, keepDraft, discardDraft, continueEditing, handleDraftChange, draftStorageFailed,
  };
}
