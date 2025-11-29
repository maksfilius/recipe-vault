"use client";

import RecipeForm from "../../components/dashboard/recipe/RecipeForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

import type { Recipe } from "../../types/recipe";
import { RecipeCard } from "../../components/dashboard/recipe/RecipeCard";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import {RecipeDetails} from "@/src/components/dashboard/recipe/RecipeDetails";

export default function Dashboard() {
  const initialRecipes: Recipe[] = [
    {
      id: 1,
      title: "Spaghetti Bolognese",
      category: 'lunch',
      description: "Classic pasta with meat sauce.",
      image: "",
      sourceUrl: ""
    },
    {
      id: 2,
      title: "Spaghetti Bolognese",
      category: 'dinner',
      description: "Classic pasta with meat sauce.",
      image: "",
      sourceUrl: ""
    },
    {
      id: 3,
      title: "Spaghetti Bolognese",
      category: "breakfast",
      description: "Classic pasta with meat sauce.",
      image: "",
      sourceUrl: "https://ui.shadcn.com/docs/components/dialog#installation"
    }
  ];
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleDeleteRecipe = (id: number) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));

    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  }

  const handleFormSubmit = (values: Omit<Recipe, "id">) => {
    if (editingRecipe) {
      const updatedRecipe: Recipe = { ...editingRecipe, ...values };

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.id === editingRecipe.id ? updatedRecipe : recipe
        )
      );

      setSelectedRecipe(prev =>
        prev && prev.id === editingRecipe.id ? updatedRecipe : prev
      );

      setEditingRecipe(updatedRecipe);
    } else {
      const newRecipe: Recipe = {
        id: Date.now(),
        ...values,
      };

      setRecipes(prev => [...prev, newRecipe]);
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
        <>
          <RecipeDetails recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} onEdit={() => handleEditRecipe(selectedRecipe)} onDelete={() => handleDeleteRecipe(selectedRecipe.id)} />
        </>
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
