"use client";

import { useEffect, useState } from "react";
import { NoticeToast } from "@/src/components/ui/notice-toast";
import { useRouter } from "next/navigation";

import { RecipeCard, RecipeCardSkeleton } from "@/src/components/dashboard/recipe/RecipeCard";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import {
  fetchFavoriteRecipeIds,
  removeFavoriteRecipe,
} from "@/src/lib/favorites";
import { mapRowToRecipe, type RecipeRow } from "@/src/lib/recipes";
import {
  getOfflineRecipeSnapshot,
  saveOfflineRecipeSnapshot,
} from "@/src/lib/offline-recipes";
import { supabase } from "@/src/lib/supabase-client";
import type { Recipe } from "@/src/types/recipe";

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function Favorites() {
  const router = useRouter();

  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [userId, setUserId] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
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
      const {
        data: { session },
      } = user ? { data: { session: null } } : await supabase.auth.getSession();
      const currentUser = user ?? session?.user ?? null;

      if (!currentUser) {
        setFavoriteRecipes([]);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      setUserId(currentUser.id);

      try {
        const favoriteIds = await fetchFavoriteRecipeIds(currentUser.id);

        if (favoriteIds.size === 0) {
          setFavoriteRecipes([]);
          setIsOfflineMode(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*, recipe_collections(collection:collections(id,user_id,name,position,created_at))")
          .eq("user_id", currentUser.id)
          .in("id", Array.from(favoriteIds))
          .order("created_at", { ascending: false });

        if (error) {
          setLoadError("Failed to load favorites. Please try again.");
          setIsLoading(false);
          return;
        }

        setFavoriteRecipes((data ?? []).map((row) => mapRowToRecipe(row as RecipeRow)));
        setIsOfflineMode(false);
      } catch {
        try {
          const snapshot = await getOfflineRecipeSnapshot(currentUser.id);
          if (!snapshot) throw new Error("No offline snapshot.");

          const favoriteIds = new Set(snapshot.favoriteRecipeIds);
          setFavoriteRecipes(snapshot.recipes.filter((recipe) => favoriteIds.has(recipe.id)));
          setIsOfflineMode(true);
        } catch {
          setLoadError("Failed to load favorites. Connect to the internet and try again.");
        }
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
    if (isOfflineMode) {
      setNotice({ type: "error", message: "Reconnect before changing favorites." });
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

    try {
      await removeFavoriteRecipe(user.id, recipeId);
      setFavoriteRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev));
      const snapshot = await getOfflineRecipeSnapshot(userId).catch(() => null);
      if (snapshot) {
        await saveOfflineRecipeSnapshot({
          userId,
          recipes: snapshot.recipes,
          collections: snapshot.collections,
          favoriteRecipeIds: snapshot.favoriteRecipeIds.filter((id) => id !== recipeId),
        }).catch(() => undefined);
      }
      setNotice({ type: "success", message: "Removed from favorites." });
    } catch {
      setNotice({ type: "error", message: "Failed to update favorites." });
    }
  };

  return (
    <>
      {notice ? (
        <NoticeToast type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} />
      ) : null}

      {isOfflineMode ? (
        <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100" role="status">
          Offline copy — favorite recipes are available to read.
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
