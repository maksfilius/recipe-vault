"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import RecipeForm from "../../components/dashboard/recipe/RecipeForm";
import { RecipeCard, RecipeCardSkeleton } from "../../components/dashboard/recipe/RecipeCard";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Plus, Search } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { RECIPE_CATEGORIES, type Recipe, type RecipeCategory } from "../../types/recipe";
import {
  addFavoriteRecipe,
  fetchFavoriteRecipeIds,
  removeFavoriteRecipe,
} from "@/src/lib/favorites";
import { mapRowToRecipe } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<RecipeCategory[]>(() => {
    const value = searchParams.get("cat");
    if (!value) return [];
    const selected = value
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is RecipeCategory => RECIPE_CATEGORIES.includes(item as RecipeCategory));

    return [...new Set(selected)];
  });

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAllRecipes([]);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError("Failed to load recipes. Please try again.");
        setIsLoading(false);
        return;
      }

      const mapped = (data ?? []).map(mapRowToRecipe);
      try {
        const favoriteIds = await fetchFavoriteRecipeIds(user.id);
        setFavoriteRecipeIds(Array.from(favoriteIds));
      } catch {
        setNotice({ type: "error", message: "Failed to load favorites." });
      }
      setAllRecipes(mapped);
      setIsLoading(false);
    };

    void fetchRecipes();
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams();
    const normalizedSearchTerm = searchTerm.trim();

    if (normalizedSearchTerm) {
      params.set("q", normalizedSearchTerm);
    }

    if (selectedCategories.length > 0) {
      params.set("cat", selectedCategories.join(","));
    }

    const next = params.toString();
    const current = searchParams.toString();

    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, searchTerm, selectedCategories]);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const toggleCategory = (category: RecipeCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((cat) => cat !== category) : [...prev, category],
    );
  };

  const filteredRecipes = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return allRecipes.filter((recipe) => {
      const matchesSearch = recipe.title.toLowerCase().includes(normalizedSearchTerm);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(recipe.category);

      return matchesSearch && matchesCategory;
    });
  }, [allRecipes, searchTerm, selectedCategories]);

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const requestDeleteRecipe = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    const id = recipeToDelete.id;

    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      setNotice({ type: "error", message: "Failed to delete recipe." });
      return;
    }

    setAllRecipes((prev) => prev.filter((recipe) => recipe.id !== id));

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }

    setRecipeToDelete(null);
    setNotice({ type: "success", message: "Recipe deleted." });
  };

  const handleFormSubmit = async (values: Omit<Recipe, "id">) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNotice({ type: "error", message: "User is not authenticated." });
      router.replace("/login");
      return;
    }

    if (editingRecipe) {
      const { data, error } = await supabase
        .from("recipes")
        .upsert({
          id: editingRecipe.id,
          user_id: user.id,
          title: values.title,
          description: values.description,
          category: values.category,
          ingredients: values.ingredients,
          steps: values.steps,
          source_url: values.sourceUrl ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select("*")
        .single();

      if (error || !data) {
        setNotice({ type: "error", message: "Failed to update recipe." });
        return;
      }

      const updated = mapRowToRecipe(data);

      setAllRecipes((prev) =>
        prev.map((recipe) => (recipe.id === updated.id ? updated : recipe))
      );

      setSelectedRecipe((prev) =>
        prev && prev.id === updated.id ? updated : prev
      );
      setEditingRecipe(updated);
      setNotice({ type: "success", message: "Recipe updated." });
    } else {
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description,
          category: values.category,
          ingredients: values.ingredients,
          steps: values.steps,
          source_url: values.sourceUrl ?? null,
        })
        .select("*")
        .single();

      if (error || !data) {
        setNotice({ type: "error", message: "Failed to create recipe." });
        return;
      }

      const created = mapRowToRecipe(data);
      setAllRecipes((prev) => [...prev, created]);
      setNotice({ type: "success", message: "Recipe created." });
    }

    setIsDialogOpen(false);
  };

  const handleToggleFavorite = async (recipeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotice({ type: "error", message: "User is not authenticated." });
      router.replace("/login");
      return;
    }

    const isFavorite = favoriteRecipeIds.includes(recipeId);

    try {
      if (isFavorite) {
        await removeFavoriteRecipe(user.id, recipeId);
        setFavoriteRecipeIds((prev) => prev.filter((id) => id !== recipeId));
        setNotice({ type: "success", message: "Removed from favorites." });
      } else {
        await addFavoriteRecipe(user.id, recipeId);
        setFavoriteRecipeIds((prev) => [...prev, recipeId]);
        setNotice({ type: "success", message: "Added to favorites." });
      }
    } catch {
      setNotice({ type: "error", message: "Failed to update favorites." });
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <>
      {notice && (
        <div
          className={cn(
            "fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
            notice.type === "error"
              ? "border-red-400/60 bg-red-500/20 text-red-100"
              : "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
          )}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecipe ? "Edit recipe" : "Add recipe"}
            </DialogTitle>
          </DialogHeader>
          <RecipeForm
            key={editingRecipe?.id ?? "new"}
            mode={editingRecipe ? "edit" : "create"}
            initialValue={editingRecipe ?? undefined}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(recipeToDelete)} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete recipe?</DialogTitle>
            <DialogDescription>
              This action can&apos;t be undone.{" "}
              {recipeToDelete ? (
                <>Recipe <span className="font-semibold text-foreground">{recipeToDelete.title}</span> will be permanently removed.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="border border-border/60"
              onClick={() => setRecipeToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-red-500/90 text-white hover:bg-red-500"
              onClick={handleDeleteRecipe}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
          onEdit={() => handleEditRecipe(selectedRecipe)}
          onDelete={() => requestDeleteRecipe(selectedRecipe)}
        />
      ) : (
        <>
          {loadError && (
            <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          )}

          <div className="flex justify-between items-center sticky">
            <h1 className="hidden sm:block text-2xl font-semibold text-foreground">
              My Recipes
            </h1>
            <Button
              variant="primary"
              size="sm"
              className="inline-flex h-10 rounded-full border border-primary/40 bg-primary/90 px-4 text-sm font-semibold sm:hidden"
              onClick={handleAddRecipe}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex h-10 rounded-full border border-primary/40 bg-primary/90 px-5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-primary"
              onClick={handleAddRecipe}
            >
              <Plus className="h-4 w-4" />
              Add recipe
            </Button>
          </div>

          <div className="mt-4 sm:mt-6">
            <label htmlFor="recipe-search" className="sr-only">
              Search recipes
            </label>
            <div className="relative max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="recipe-search"
                type="text"
                placeholder="Search recipes by title"
                value={searchTerm}
                onChange={handleChange}
                className="h-10 bg-card pl-9"
              />
            </div>
            <div className="relative max-w-xl">
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedCategories.length === 0 ? "primary" : "ghost"}
                  size="xs"
                  className={cn(
                    "rounded-full px-4 capitalize",
                    selectedCategories.length !== 0 && "border-border/60 bg-card/40"
                  )}
                  onClick={() => setSelectedCategories([])}
                >
                  all
                </Button>
              {RECIPE_CATEGORIES.map((value) => (
                <Button
                  type="button"
                  key={value}
                  aria-pressed={selectedCategories.includes(value)}
                  onClick={() => toggleCategory(value)}
                  variant={selectedCategories.includes(value) ? "primary" : "ghost"}
                  size="xs"
                  className={cn(
                    "rounded-full px-4 capitalize",
                    !selectedCategories.includes(value) && "border-border/60 bg-card/40"
                  )}
                >
                  {value}
                </Button>
              ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <RecipeCardSkeleton key={`skeleton-${index}`} />
              ))
            ) : filteredRecipes.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-border/60 bg-card/50 px-5 py-8 text-center">
                <h2 className="text-base font-semibold text-foreground">
                  {allRecipes.length === 0 ? "No recipes yet" : "No recipes found"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {allRecipes.length === 0
                    ? "Create your first recipe to get started."
                    : "Try another search or reset filters."}
                </p>
                {allRecipes.length === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 rounded-full px-4"
                    onClick={handleAddRecipe}
                  >
                    <Plus className="h-4 w-4" />
                    Add recipe
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-4 rounded-full border border-border/60 px-4"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategories([]);
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                  isFavorite={favoriteRecipeIds.includes(recipe.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
