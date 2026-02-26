"use client";

import { useEffect, useState } from "react";

import RecipeForm from "../../components/dashboard/recipe/RecipeForm";
import { RecipeCard } from "../../components/dashboard/recipe/RecipeCard";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

import type { Recipe } from "../../types/recipe";
import { mapRowToRecipe } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";

export default function Dashboard() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRecipes([]);
        return;
      }

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map(mapRowToRecipe);
      setRecipes(mapped);
    };

    void fetchRecipes();
  }, []);

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);

    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  };

  const handleFormSubmit = async (values: Omit<Recipe, "id">) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    if (editingRecipe) {
      const { data, error } = await supabase
        .from("recipes")
        .update({
          title: values.title,
          description: values.description,
          category: values.category,
          ingredients: values.ingredients,
          steps: values.steps,
          image_url: values.image ?? null,
          source_url: values.sourceUrl ?? null,
        })
        .eq("id", editingRecipe.id)
        .select("*")
        .single();

      if (error || !data) {
        console.error("Failed to update recipe", error);
        return;
      }

      const updated = mapRowToRecipe(data);

      setRecipes((prev) =>
        prev.map((recipe) => (recipe.id === updated.id ? updated : recipe))
      );

      setSelectedRecipe((prev) =>
        prev && prev.id === updated.id ? updated : prev
      );
      setEditingRecipe(updated);
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
          image_url: values.image ?? null,
          source_url: values.sourceUrl ?? null,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error("Failed to create recipe", error);
        return;
      }

      const created = mapRowToRecipe(data);
      setRecipes((prev) => [...prev, created]);
    }

    setIsDialogOpen(false);
  };


  return (
    <>
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

      {selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
          onEdit={() => handleEditRecipe(selectedRecipe)}
          onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center sticky">
            <h1 className="hidden sm:block text-2xl font-semibold text-foreground">
              My Recipes
            </h1>
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex px-4"
              onClick={handleAddRecipe}
            >
              + Add new recipe
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
