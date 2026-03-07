"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import RecipeForm from "../../components/dashboard/recipe/RecipeForm";
import { RecipeCard } from "../../components/dashboard/recipe/RecipeCard";
import { RecipeDetails } from "@/src/components/dashboard/recipe/RecipeDetails";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Search } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { RECIPE_CATEGORIES, type Recipe, type RecipeCategory } from "../../types/recipe";
import { mapRowToRecipe } from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";

export default function Dashboard() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RecipeCategory[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAllRecipes([]);
        return;
      }

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map(mapRowToRecipe);
      setAllRecipes(mapped);
    };

    void fetchRecipes();
  }, []);

  const toggleCategory = (category: RecipeCategory)=> {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((cat) => cat !== category) : [...prev, category]

    )
  }

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
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

  const handleDeleteRecipe = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);

    setAllRecipes((prev) => prev.filter((recipe) => recipe.id !== id));

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
      const { error } = await supabase
        .from("recipes")
        .upsert({
          id: editingRecipe.id,
          user_id: user.id,
          title: values.title,
          description: values.description,
          category: values.category,
          ingredients: values.ingredients,
          steps: values.steps,
          image_url: values.image ?? null,
          source_url: values.sourceUrl ?? null,
        }, { onConflict: "id" });

      if (error) {
        console.error("Failed to update recipe", error);
        return;
      }

      const updated: Recipe = {
        ...editingRecipe,
        ...values,
        image: values.image ?? undefined,
        sourceUrl: values.sourceUrl ?? undefined,
      };

      setAllRecipes((prev) =>
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
      setAllRecipes((prev) => [...prev, created]);
    }

    setIsDialogOpen(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
            {filteredRecipes.map((recipe) => (
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
