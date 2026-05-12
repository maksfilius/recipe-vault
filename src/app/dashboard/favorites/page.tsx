"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { RecipeCard, RecipeCardSkeleton } from "@/src/components/dashboard/recipe/RecipeCard";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import {
  fetchFavoriteRecipeIds,
  removeFavoriteRecipe,
} from "@/src/lib/favorites";
import { mapRowToRecipe } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";
import type { Recipe } from "@/src/types/recipe";

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function Favorites() {
  const router = useRouter();

  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavoriteRecipes([]);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const favoriteIds = await fetchFavoriteRecipeIds(user.id);

        if (favoriteIds.size === 0) {
          setFavoriteRecipes([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", user.id)
          .in("id", Array.from(favoriteIds))
          .order("created_at", { ascending: false });

        if (error) {
          setLoadError("Failed to load favorites. Please try again.");
          setIsLoading(false);
          return;
        }

        setFavoriteRecipes((data ?? []).map(mapRowToRecipe));
      } catch {
        setLoadError("Failed to load favorites. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFavorites();
  }, [router]);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const handleToggleFavorite = async (recipeId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNotice({ type: "error", message: "User is not authenticated." });
      router.replace("/login");
      return;
    }

    try {
      await removeFavoriteRecipe(user.id, recipeId);
      setFavoriteRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev));
      setNotice({ type: "success", message: "Removed from favorites." });
    } catch {
      setNotice({ type: "error", message: "Failed to update favorites." });
    }
  };

  return (
    <>
      {notice ? (
        <div
          className={[
            "fixed left-4 right-4 top-20 z-[80] max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm sm:left-auto sm:right-6 sm:top-20",
            notice.type === "error"
              ? "border-red-300/70 bg-red-50/92 text-red-700 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-100"
              : "border-emerald-300/70 bg-emerald-50/92 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-100",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      ) : null}

      {selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
          showActions={false}
        />
      ) : (
        <section className="mx-auto max-w-6xl space-y-5">

          {loadError ? (
            <div className="rounded-xl border border-red-300/70 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-[0_12px_32px_hsl(var(--foreground)_/_0.05)] dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
              {loadError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <RecipeCardSkeleton key={`favorites-skeleton-${index}`} />
              ))
            ) : favoriteRecipes.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)_/_0.9),hsl(var(--muted)_/_0.45))] px-5 py-8 text-center shadow-[0_18px_48px_hsl(var(--foreground)_/_0.06)]">
                <h2 className="text-base font-semibold text-foreground">No favorite recipes yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add recipes to favorites from the main list and they will appear here.
                </p>
              </div>
            ) : (
              favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                  isFavorite
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
            )}
          </div>
        </section>
      )}
    </>
  );
}
