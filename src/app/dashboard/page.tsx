"use client";

import RecipeForm from "../../components/dashboard/recipe/RecipeForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

import type { Recipe } from "../../types/recipe";
import { RecipeCard } from "../../components/dashboard/recipe/RecipeCard";
import { Button } from "../../components/ui/button";
import { useState } from "react";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsDialogOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center sticky">
        <h1 className="hidden sm:block text-2xl font-semibold text-foreground">My Recipes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm" className="hidden sm:inline-flex px-4" onClick={handleAddRecipe}>
              + Add new recipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add/Edit Recipe</DialogTitle>
              <RecipeForm
                key={selectedRecipe?.id ?? "new"}
                mode={selectedRecipe ? "edit" : "create"}
                initialValue={selectedRecipe ?? undefined}
                onSubmit={(values) => {
                  if (selectedRecipe) {
                    setRecipes(prev =>
                      prev.map((recipe) =>
                        recipe.id === selectedRecipe.id
                          ? { ...recipe, ...values }
                          : recipe
                      )
                    );
                  } else {
                    setRecipes(prev => [
                      ...prev,
                      {
                        id: Date.now(),
                        ...values,
                      } as Recipe,
                    ]);
                  }
                  setIsDialogOpen(false);
                  setSelectedRecipe(null);
                }}
              />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={() => {
            handleEditRecipe(recipe);
          }}/>
        ))}
      </div>
    </>
  );
}
