"use client";

import { useEffect } from "react";

import { RecipeCard, RecipeCardSkeleton } from "./recipe/RecipeCard";
import { RecipeDetails } from "./recipe/RecipeDetails";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { NoticeToast } from "@/src/components/ui/notice-toast";
import { useDashboardData } from "./useDashboardData";
import { useDashboardFilters } from "./useDashboardFilters";
import { useDashboardActions } from "./useDashboardActions";
import { DashboardDialogs } from "./DashboardDialogs";
import { EmptyLibrary } from "./EmptyLibrary";
import { RecipeCarousel } from "./recipe/RecipeCarousel";
import type { Recipe } from "@/src/types/recipe";
import { trackAnalytics } from "@/src/lib/analytics";

export default function Dashboard() {
  const data = useDashboardData();
  const { allRecipes, isLoading, isOfflineMode, loadError } = data;
  const { searchTerm, filteredRecipes, clearAllFilters } = useDashboardFilters(allRecipes);
  const actions = useDashboardActions({ data });
  const { selectedRecipe, setSelectedRecipe, notice, setNotice, setRecipeToDelete,
    handleAddRecipe, handleEditRecipe } = actions;

  // Phones get a carousel, wider screens the grid; empty, loading and error states are shared.
  const showRecipes = !isLoading && !loadError && filteredRecipes.length > 0;
  const openRecipe = (recipe: Recipe) => {
    trackAnalytics("recipe_opened", { entry_point: searchTerm.trim() ? "search" : "dashboard" });
    setSelectedRecipe(recipe);
  };

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
        <RecipeDetails recipe={selectedRecipe} onBack={() => { actions.setFirstCookHintRecipeId(null); setSelectedRecipe(null); }}
          onEdit={() => handleEditRecipe(selectedRecipe)} onDelete={() => setRecipeToDelete(selectedRecipe)} showActions={!isOfflineMode}
          showFirstCookHint={actions.firstCookHintRecipeId === selectedRecipe.id}
          onDismissFirstCookHint={() => actions.setFirstCookHintRecipeId(null)} />
      ) : (
        <section className="mx-auto max-w-7xl min-w-0 pb-8">
          {showRecipes ? (
            <div className="sm:hidden">
              <RecipeCarousel recipes={filteredRecipes} resetKey={searchTerm} onOpen={openRecipe} />
            </div>
          ) : null}
          <div className={`${showRecipes ? "hidden sm:grid" : "grid"} grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4`}>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => <RecipeCardSkeleton key={`skeleton-${index}`} />)
            ) : loadError ? (
              <EmptyState className="col-span-full" title="Connect to load your recipes" description={loadError} action={<Button type="button" onClick={() => window.location.reload()}>Retry</Button>} />
            ) : allRecipes.length === 0 ? (
              <div className="col-span-full">
                <EmptyLibrary
                  importUrl={actions.importUrl} setImportUrl={actions.setImportUrl} importError={actions.importError}
                  clearImportError={() => actions.setImportError("")}
                  isImporting={actions.isImportingRecipe} isSaving={actions.isSavingRecipe} isOffline={isOfflineMode}
                  onImport={actions.handleImportRecipe} onManualSubmit={actions.handleFormSubmit}
                />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <EmptyState className="col-span-full" title="No recipes found" description={searchTerm.trim() ? `Nothing matches “${searchTerm.trim()}”.` : "No recipes match your search."} action={<Button type="button" onClick={clearAllFilters}>Clear search</Button>} />
            ) : (
              filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onClick={() => openRecipe(recipe)} />)
            )}
          </div>
        </section>
      )}
    </>
  );
}
