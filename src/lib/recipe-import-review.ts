import type { Ingredient, Step } from "@/src/types/recipe";

type ImportReviewRecipe = {
  title: string;
  description?: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  steps: Step[];
};

export function getImportReviewWarnings(recipe: ImportReviewRecipe): string[] {
  const warnings: string[] = [];
  if (!recipe.title.trim()) warnings.push("Add a recipe name before saving.");
  if (!recipe.imageUrl) warnings.push("No photo was imported.");
  if (!recipe.ingredients.some((ingredient) => ingredient.name.trim())) warnings.push("No ingredients were imported.");
  if (!recipe.steps.some((step) => step.text.trim())) warnings.push("No steps were imported. Add one to use cooking mode.");
  return warnings;
}
