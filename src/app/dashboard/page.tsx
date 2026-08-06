"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderCog, Plus, Search, Tag, Trash2 } from "lucide-react";

import RecipeForm, {
  type RecipeFormInitialValue,
  type RecipeFormValues,
} from "../../components/dashboard/recipe/RecipeForm";
import { RecipeCard, RecipeCardSkeleton } from "../../components/dashboard/recipe/RecipeCard";
import { RecipeDeck } from "../../components/dashboard/recipe/RecipeDeck";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { NoticeToast } from "@/src/components/ui/notice-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  createRecipeCollection,
  deleteRecipeCollection,
  fetchRecipeCollections,
} from "@/src/lib/collections";
import {
  getOfflineRecipeSnapshot,
  saveOfflineRecipeSnapshot,
} from "@/src/lib/offline-recipes";
import type { ImportedRecipe, Recipe, RecipeCollection } from "../../types/recipe";
import {
  addFavoriteRecipe,
  fetchFavoriteRecipeIds,
  removeFavoriteRecipe,
} from "@/src/lib/favorites";
import { recipePayloadSchema } from "@/src/lib/recipe-validation";
import { mapRowToRecipe, type RecipeRow } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";

type Notice = {
  type: "success" | "error";
  message: string;
};

type AddRecipeMode = "select" | "manual";
type DraftRecipe = RecipeFormInitialValue;
type DraftRecipeInput = Partial<ImportedRecipe> & { collectionIds?: string[] };

function splitQueryParam(value: string | null) {
  return value
    ? [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]
    : [];
}

function createDraftRecipe(
  partial: DraftRecipeInput | undefined,
  collections: RecipeCollection[],
): DraftRecipe {
  const requestedIds = new Set(partial?.collectionIds ?? []);
  const suggestedName = partial?.suggestedCollection?.toLocaleLowerCase();
  const selectedCollections = collections.filter(
    (collection) =>
      requestedIds.has(collection.id) ||
      (suggestedName && collection.name.toLocaleLowerCase() === suggestedName),
  );

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

function isDraftImportedRecipe(recipe: DraftRecipe | null) {
  return Boolean(recipe?.id.startsWith("draft-import-"));
}

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState("");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<DraftRecipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addRecipeMode, setAddRecipeMode] = useState<AddRecipeMode>("select");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedRecipeData, setHasLoadedRecipeData] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<RecipeCollection | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [importError, setImportError] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(() =>
    splitQueryParam(searchParams.get("collections")),
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    splitQueryParam(searchParams.get("tags")),
  );

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = user ? { data: { session: null } } : await supabase.auth.getSession();
      const currentUser = user ?? session?.user ?? null;

      if (!currentUser) {
        setAllRecipes([]);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      setUserId(currentUser.id);

      try {
        const [availableCollections, recipeResult, favoriteIds] = await Promise.all([
          fetchRecipeCollections(currentUser.id),
          supabase
            .from("recipes")
            .select("*, recipe_collections(collection:collections(id,user_id,name,position,created_at))")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false }),
          fetchFavoriteRecipeIds(currentUser.id),
        ]);

        if (recipeResult.error) throw recipeResult.error;

        setCollections(availableCollections);
        setAllRecipes(((recipeResult.data ?? []) as RecipeRow[]).map((row) => mapRowToRecipe(row)));
        setFavoriteRecipeIds(Array.from(favoriteIds));
        setIsOfflineMode(false);
        setHasLoadedRecipeData(true);
      } catch {
        try {
          const snapshot = await getOfflineRecipeSnapshot(currentUser.id);
          if (!snapshot) throw new Error("No offline snapshot.");

          setCollections(snapshot.collections);
          setAllRecipes(snapshot.recipes);
          setFavoriteRecipeIds(snapshot.favoriteRecipeIds);
          setIsOfflineMode(true);
          setHasLoadedRecipeData(true);
        } catch {
          setLoadError("Failed to load recipes. Connect to the internet and try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRecipes();
  }, [router]);

  useEffect(() => {
    if (!hasLoadedRecipeData || !userId) return;

    void saveOfflineRecipeSnapshot({
      userId,
      recipes: allRecipes,
      collections,
      favoriteRecipeIds,
    }).catch(() => {
      // IndexedDB can be unavailable in private browsing; online behavior still works.
    });
  }, [allRecipes, collections, favoriteRecipeIds, hasLoadedRecipeData, userId]);

  useEffect(() => {
    if (isLoading) return;

    let storedImport: string | null = null;
    try {
      storedImport = window.sessionStorage.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    } catch {
      return;
    }
    if (!storedImport) return;

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
      window.sessionStorage.removeItem(PENDING_RECIPE_IMPORT_STORAGE_KEY);
    }
  }, [collections, isLoading]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCollectionIds.length > 0) params.set("collections", selectedCollectionIds.join(","));
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams, searchTerm, selectedCollectionIds, selectedTags]);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const availableTags = useMemo(() => {
    const byNormalizedName = new Map<string, string>();
    allRecipes.forEach((recipe) =>
      recipe.tags.forEach((tagName) => {
        const normalized = tagName.toLocaleLowerCase();
        if (!byNormalizedName.has(normalized)) byNormalizedName.set(normalized, tagName);
      }),
    );
    return [...byNormalizedName.values()].sort((a, b) => a.localeCompare(b));
  }, [allRecipes]);

  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();

    return allRecipes.filter((recipe) => {
      const searchableText = [
        recipe.title,
        recipe.description,
        ...recipe.tags,
        ...recipe.collections.map((collection) => collection.name),
      ].join(" ").toLocaleLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesCollection =
        selectedCollectionIds.length === 0 ||
        recipe.collections.some((collection) => selectedCollectionIds.includes(collection.id));
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) =>
          recipe.tags.some((tagName) => tagName.toLocaleLowerCase() === selectedTag.toLocaleLowerCase()),
        );

      return matchesSearch && matchesCollection && matchesTags;
    });
  }, [allRecipes, searchTerm, selectedCollectionIds, selectedTags]);

  const handleCreateCollection = async (name: string) => {
    if (isOfflineMode) return null;
    const normalizedName = name.trim();
    if (!normalizedName || !userId) return null;

    const existing = collections.find(
      (collection) => collection.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
    );
    if (existing) return existing;

    try {
      const nextPosition = collections.reduce(
        (maximum, collection) => Math.max(maximum, collection.position),
        -1,
      ) + 1;
      const created = await createRecipeCollection(userId, normalizedName, nextPosition);
      setCollections((current) => [...current, created]);
      return created;
    } catch {
      return null;
    }
  };

  const handleManagerCreateCollection = async () => {
    setCollectionError("");
    const created = await handleCreateCollection(newCollectionName);
    if (!created) {
      setCollectionError("Could not create this collection. It may already exist.");
      return;
    }
    setNewCollectionName("");
    setNotice({ type: "success", message: `Collection “${created.name}” is ready.` });
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteRecipeCollection(collectionToDelete.id);
      const deletedId = collectionToDelete.id;
      setCollections((current) => current.filter((collection) => collection.id !== deletedId));
      setAllRecipes((current) =>
        current.map((recipe) => ({
          ...recipe,
          collections: recipe.collections.filter((collection) => collection.id !== deletedId),
        })),
      );
      setSelectedCollectionIds((current) => current.filter((id) => id !== deletedId));
      setCollectionToDelete(null);
      setNotice({ type: "success", message: "Collection deleted. Recipes were kept." });
    } catch {
      setNotice({ type: "error", message: "Failed to delete collection." });
    }
  };

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
    const parsedValues = recipePayloadSchema.safeParse(values);
    if (!parsedValues.success) {
      setNotice({
        type: "error",
        message: parsedValues.error.issues[0]?.message ?? "Recipe data is invalid.",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNotice({ type: "error", message: "User is not authenticated." });
      router.replace("/login");
      return;
    }

    let imageUrl: string | undefined;
    try {
      imageUrl = await persistRecipeImage(parsedValues.data.imageUrl);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "The recipe image could not be saved.",
      });
      return;
    }

    const recipeId =
      editingRecipe && !isDraftImportedRecipe(editingRecipe)
        ? editingRecipe.id
        : globalThis.crypto.randomUUID();
    const selectedCollections = collections.filter((collection) =>
      parsedValues.data.collectionIds.includes(collection.id),
    );
    const { data, error } = await supabase.rpc("save_recipe", {
      p_recipe_id: recipeId,
      p_title: parsedValues.data.title,
      p_description: parsedValues.data.description,
      p_ingredients: parsedValues.data.ingredients,
      p_steps: parsedValues.data.steps,
      p_image_url: imageUrl ?? null,
      p_source_url: parsedValues.data.sourceUrl ?? null,
      p_total_time: parsedValues.data.totalTime ?? null,
      p_servings: parsedValues.data.servings ?? null,
      p_tags: parsedValues.data.tags,
      p_collection_ids: parsedValues.data.collectionIds,
    });

    const savedRow = (Array.isArray(data) ? data[0] : data) as RecipeRow | null;
    if (error || !savedRow) {
      setNotice({
        type: "error",
        message:
          error?.code === "23505"
            ? "This source link is already saved in your cookbook."
            : "Failed to save recipe.",
      });
      return;
    }

    const saved = mapRowToRecipe(savedRow, selectedCollections);
    const isUpdate = Boolean(editingRecipe && !isDraftImportedRecipe(editingRecipe));
    setAllRecipes((current) =>
      isUpdate
        ? current.map((recipe) => (recipe.id === saved.id ? saved : recipe))
        : [saved, ...current],
    );
    setSelectedRecipe((current) => (current?.id === saved.id ? saved : current));
    setNotice({ type: "success", message: isUpdate ? "Recipe updated." : "Recipe created." });
    handleDialogOpenChange(false);
  };

  const handleImportRecipe = async () => {
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
        | (ImportedRecipe & { error?: string })
        | null;
      const parsedPayload = payload ? recipePayloadSchema.safeParse(payload) : null;

      if (!response.ok || !payload || !parsedPayload?.success) {
        setImportError(payload?.error ?? "Failed to import recipe.");
        return;
      }

      setEditingRecipe(createDraftRecipe(parsedPayload.data, collections));
      setAddRecipeMode("manual");
      setNotice({ type: "success", message: "Recipe imported. Review and save it." });
    } catch {
      setImportError("Failed to import recipe.");
    } finally {
      setIsImportingRecipe(false);
    }
  };

  const handleToggleFavorite = async (recipeId: string) => {
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before changing favorites." });
      return;
    }
    if (!userId) return;
    const isFavorite = favoriteRecipeIds.includes(recipeId);

    try {
      if (isFavorite) {
        await removeFavoriteRecipe(userId, recipeId);
        setFavoriteRecipeIds((current) => current.filter((id) => id !== recipeId));
        setNotice({ type: "success", message: "Removed from favorites." });
      } else {
        await addFavoriteRecipe(userId, recipeId);
        setFavoriteRecipeIds((current) => [...current, recipeId]);
        setNotice({ type: "success", message: "Added to favorites." });
      }
    } catch {
      setNotice({ type: "error", message: "Failed to update favorites." });
    }
  };

  const toggleItem = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  // "All" lives in the same rail as the collection and tag chips, so it clears
  // those selections. It deliberately leaves the typed search term alone.
  const hasFacetFilters = selectedCollectionIds.length > 0 || selectedTags.length > 0;
  const clearFacetFilters = () => {
    setSelectedCollectionIds([]);
    setSelectedTags([]);
  };

  return (
    <>
      {notice ? (
        <NoticeToast type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />
      ) : null}

      {isOfflineMode ? (
        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100" role="status">
          Offline copy — recipes are available to read. Reconnect before making changes.
        </div>
      ) : null}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecipe
                ? isDraftImportedRecipe(editingRecipe) ? "Review imported recipe" : "Edit recipe"
                : "Add recipe"}
            </DialogTitle>
            {!editingRecipe && addRecipeMode === "select" ? (
              <DialogDescription>Choose how you want to add this recipe.</DialogDescription>
            ) : null}
          </DialogHeader>
          {!editingRecipe && addRecipeMode === "select" ? (
            <div className="grid gap-3">
              <button type="button" className="rounded-2xl border border-border/60 bg-card/50 p-4 text-left hover:bg-card" onClick={() => setAddRecipeMode("manual")}>
                <p className="text-sm font-semibold">Add manually</p>
                <p className="mt-1 text-sm text-muted-foreground">Fill out the recipe form yourself.</p>
              </button>
              <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
                <p className="text-sm font-semibold">Import from URL</p>
                <p className="mt-1 text-sm text-muted-foreground">Paste a recipe page link and we&apos;ll prefill the form.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input type="url" value={importUrl} onChange={(event) => setImportUrl(event.target.value)} placeholder="https://example.com/recipe" className="flex-1" />
                  <Button type="button" onClick={() => void handleImportRecipe()} disabled={isImportingRecipe}>
                    {isImportingRecipe ? "Importing..." : "Import recipe"}
                  </Button>
                </div>
                {importError ? <p className="mt-3 text-sm text-destructive">{importError}</p> : null}
              </div>
            </div>
          ) : addRecipeMode === "manual" ? (
            <>
              {!editingRecipe ? <Button type="button" variant="ghost" size="sm" onClick={() => setAddRecipeMode("select")}>Back</Button> : null}
              <RecipeForm
                key={editingRecipe?.id ?? "new"}
                mode={editingRecipe && !isDraftImportedRecipe(editingRecipe) ? "edit" : "create"}
                initialValue={editingRecipe ?? undefined}
                collections={collections}
                onCreateCollection={handleCreateCollection}
                onSubmit={(values) => void handleFormSubmit(values)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collections</DialogTitle>
            <DialogDescription>Collections are your only broad grouping system. Deleting one never deletes its recipes.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={newCollectionName} onChange={(event) => { setNewCollectionName(event.target.value); setCollectionError(""); }} placeholder="New collection" maxLength={80} />
            <Button type="button" onClick={() => void handleManagerCreateCollection()} disabled={!newCollectionName.trim()}><Plus />Create</Button>
          </div>
          {collectionError ? <p className="text-sm text-destructive">{collectionError}</p> : null}
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/55 px-3 py-2">
                <span className="truncate text-sm font-medium">{collection.name}</span>
                <Button type="button" variant="ghost" size="xs" aria-label={`Delete ${collection.name}`} onClick={() => setCollectionToDelete(collection)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(recipeToDelete)} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete recipe?</DialogTitle><DialogDescription>This permanently deletes {recipeToDelete?.title ?? "this recipe"}.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setRecipeToDelete(null)}>Cancel</Button><Button className="bg-red-500 text-white" onClick={() => void handleDeleteRecipe()}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(collectionToDelete)} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete collection?</DialogTitle><DialogDescription>“{collectionToDelete?.name}” will be removed, but its recipes will stay in your cookbook.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setCollectionToDelete(null)}>Cancel</Button><Button className="bg-red-500 text-white" onClick={() => void handleDeleteCollection()}>Delete collection</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRecipe ? (
        <RecipeDetails recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} onEdit={() => handleEditRecipe(selectedRecipe)} onDelete={() => setRecipeToDelete(selectedRecipe)} showActions={!isOfflineMode} />
      ) : (
        // Below sm this column owns the visible height so the recipe pager can be
        // the only scroller. From sm up it goes back to a normal block and the page
        // scrolls as before.
        <div className="flex h-full min-h-0 flex-col sm:block sm:h-auto">
          {loadError ? <div className="mb-4 rounded-xl border border-red-300/70 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">{loadError}</div> : null}

          <div className="mt-4 shrink-0 space-y-2 sm:mt-6 sm:space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search recipes, collections, or tags" value={searchTerm} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)} className="h-10 bg-card/88 pl-9" />
              </div>
              <Button type="button" variant="ghost" aria-label="Manage collections" className="h-10 shrink-0 border border-border/60" disabled={isOfflineMode} onClick={() => setIsCollectionDialogOpen(true)}>
                <FolderCog />
                <span className="hidden sm:inline">Manage collections</span>
              </Button>
            </div>

            {/* One filter rail instead of a labelled row per facet: it scrolls
                sideways on a phone and wraps on wide screens. */}
            <div
              role="group"
              aria-label="Filter by collection or tag"
              className="-mx-5 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max items-center gap-2 sm:w-auto sm:max-w-5xl sm:flex-wrap">
                <Button type="button" variant={hasFacetFilters ? "ghost" : "primary"} size="xs" className="shrink-0 rounded-full border-border/60" onClick={clearFacetFilters}>All</Button>
                {collections.map((collection) => (
                  <Button key={collection.id} type="button" variant={selectedCollectionIds.includes(collection.id) ? "primary" : "ghost"} size="xs" className="shrink-0 rounded-full border-border/60" onClick={() => toggleItem(collection.id, setSelectedCollectionIds)}>{collection.name}</Button>
                ))}
                {availableTags.length > 0 ? (
                  <span className="mx-1 h-5 w-px shrink-0 bg-border/70" aria-hidden />
                ) : null}
                {availableTags.map((tagName) => (
                  <Button key={tagName} type="button" variant={selectedTags.includes(tagName) ? "primary" : "ghost"} size="xs" className="shrink-0 rounded-full border-border/60" onClick={() => toggleItem(tagName, setSelectedTags)}>
                    <Tag className="h-3 w-3 opacity-70" />
                    {tagName}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {isLoading || filteredRecipes.length === 0 ? (
            <div className="mt-4 min-h-0 flex-1 sm:mt-8 sm:flex-none sm:pb-28">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => <RecipeCardSkeleton key={`skeleton-${index}`} />)
                ) : (
                  <div className="col-span-full rounded-2xl border border-border/60 bg-card/70 px-5 py-8 text-center">
                    <h2 className="font-semibold">{allRecipes.length === 0 ? "No recipes yet" : "No recipes found"}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{allRecipes.length === 0 ? "Create your first recipe to get started." : "Try another search or reset filters."}</p>
                    <Button type="button" size="sm" className="mt-4" disabled={isOfflineMode && allRecipes.length === 0} onClick={allRecipes.length === 0 ? handleAddRecipe : () => { setSearchTerm(""); setSelectedCollectionIds([]); setSelectedTags([]); }}>
                      {allRecipes.length === 0 ? <><Plus />Add recipe</> : "Reset filters"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Phones get a card deck: the recipes sit one behind another and a
                  swipe up sends the front one away. Only a few cards are mounted, so
                  rendering it alongside the desktop grid stays cheap, and CSS decides
                  which one is live — no media-query state, no hydration mismatch. */}
              <div className="mt-4 min-h-0 flex-1 sm:hidden">
                <RecipeDeck
                  recipes={filteredRecipes}
                  favoriteRecipeIds={favoriteRecipeIds}
                  onOpen={setSelectedRecipe}
                  onToggleFavorite={(id) => void handleToggleFavorite(id)}
                />
              </div>

              <div className="hidden sm:mt-8 sm:block sm:pb-28">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} isFavorite={favoriteRecipeIds.includes(recipe.id)} onToggleFavorite={(id) => void handleToggleFavorite(id)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {allRecipes.length > 0 && !isOfflineMode ? <Button type="button" className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-20 h-12 rounded-full px-4 shadow-xl md:bottom-6 md:right-6" onClick={handleAddRecipe}><Plus />Add recipe</Button> : null}
        </div>
      )}
    </>
  );
}
