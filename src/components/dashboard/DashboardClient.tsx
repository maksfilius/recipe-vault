"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { RecipeCard, RecipeCardSkeleton } from "./recipe/RecipeCard";
import { RecipeDetails } from "./recipe/RecipeDetails";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { NoticeToast } from "@/src/components/ui/notice-toast";
import { useDashboardData } from "./useDashboardData";
import { useDashboardFilters } from "./useDashboardFilters";
import { useDashboardActions } from "./useDashboardActions";
import { DashboardDialogs } from "./DashboardDialogs";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [importDraftId, setImportDraftId] = useState(() => searchParams.get("importDraft"));
  const data = useDashboardData(importDraftId);
  const { allRecipes, isLoading, isOfflineMode, loadError } = data;
  const { searchTerm, filteredRecipes, clearAllFilters } = useDashboardFilters(allRecipes, importDraftId);
  const actions = useDashboardActions({ data, importDraftId, setImportDraftId });
  const { selectedRecipe, setSelectedRecipe, notice, setNotice, setRecipeToDelete,
    handleAddRecipe, handleEditRecipe } = actions;

  useEffect(() => {
    window.addEventListener("keep-and-cook:add-recipe", handleAddRecipe);
    return () => window.removeEventListener("keep-and-cook:add-recipe", handleAddRecipe);
  }, [handleAddRecipe]);

  return (
    <>
      {notice ? <NoticeToast type={notice.type} message={notice.message} onDismiss={() => setNotice(null)} /> : null}
      {isOfflineMode ? (
        <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground" role="status">
          Offline copy — recipes are available to read. Reconnect before making changes.
        </div>
      ) : null}

      <DashboardDialogs actions={actions} />

      {selectedRecipe ? (
        <RecipeDetails recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} onEdit={() => handleEditRecipe(selectedRecipe)} onDelete={() => setRecipeToDelete(selectedRecipe)} showActions={!isOfflineMode} />
      ) : (
        <section className="mx-auto max-w-7xl min-w-0 pb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => <RecipeCardSkeleton key={`skeleton-${index}`} />)
            ) : loadError ? (
              <EmptyState className="col-span-full" title="Connect to load your recipes" description={loadError} action={<Button type="button" onClick={() => window.location.reload()}>Retry</Button>} />
            ) : allRecipes.length === 0 ? (
              <EmptyState className="col-span-full" title="No recipes yet" description="Save a recipe to begin your cookbook." action={<Button type="button" disabled={isOfflineMode} onClick={handleAddRecipe}><Plus className="size-4" aria-hidden="true" />Add recipe</Button>} />
            ) : filteredRecipes.length === 0 ? (
              <EmptyState className="col-span-full" title="No recipes found" description={searchTerm.trim() ? `Nothing matches “${searchTerm.trim()}”.` : "No recipes match your search."} action={<Button type="button" onClick={clearAllFilters}>Clear search</Button>} />
            ) : (
              filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />)
            )}
          </div>
        </section>
      )}
    </>
  );
}
