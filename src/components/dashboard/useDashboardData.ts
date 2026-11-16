"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchRecipeCollections } from "@/src/lib/collections";
import { fetchFavoriteRecipeIds } from "@/src/lib/favorites";
import { getOfflineRecipeSnapshot, saveOfflineRecipeSnapshot } from "@/src/lib/offline-recipes";
import { mapRowToRecipe, type RecipeRow } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";
import { resolveDashboardIdentity } from "@/src/lib/dashboard-auth";
import type { Recipe, RecipeCollection } from "@/src/types/recipe";

export function useDashboardData(importDraftId: string | null) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedRecipeData, setHasLoadedRecipeData] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      setLoadError("");

      const identity = await resolveDashboardIdentity(supabase.auth);
      if (!identity.userId) {
        setAllRecipes([]);
        setIsLoading(false);
        // Keep ?add and ?url from a share; the login page filters next through getImportAuthDestination.
        const next = importDraftId ? `/dashboard?importDraft=${importDraftId}` : `/dashboard${window.location.search}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const currentUser = { id: identity.userId };
      setUserId(currentUser.id);
      const restoreOffline = async () => {
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
      };

      if (identity.offline) {
        await restoreOffline();
        setIsLoading(false);
        return;
      }

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
        await restoreOffline();
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRecipes();
  }, [router, importDraftId]);

  useEffect(() => {
    if (!hasLoadedRecipeData || !userId) return;
    void saveOfflineRecipeSnapshot({ userId, recipes: allRecipes, collections, favoriteRecipeIds }).catch(() => {
      // IndexedDB can be unavailable in private browsing; online behavior still works.
    });
  }, [allRecipes, collections, favoriteRecipeIds, hasLoadedRecipeData, userId]);

  return {
    userId, allRecipes, setAllRecipes, collections, setCollections,
    isLoading, isOfflineMode, loadError,
  };
}
