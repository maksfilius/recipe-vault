import type { Recipe, RecipeCollection } from "../types/recipe.ts";

export function buildRecipeExport(recipes: Recipe[], collections: RecipeCollection[], exportedAt: string) {
  return {
    formatVersion: 1,
    exportedAt,
    collections,
    recipes: recipes.map((recipe) => ({
      "@context": "https://schema.org",
      "@type": "Recipe",
      identifier: recipe.id,
      name: recipe.title,
      description: recipe.description,
      image: recipe.imageUrl,
      url: recipe.sourceUrl,
      totalTime: recipe.totalTime,
      recipeYield: recipe.servings,
      keywords: recipe.tags,
      recipeIngredient: recipe.ingredients.map((ingredient) =>
        [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ")),
      recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step.text })),
      keepAndCook: {
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        collectionIds: recipe.collections.map((collection) => collection.id),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    })),
  };
}
