import type { Recipe } from "@/src/types/recipe";

function timestamp(value?: string) {
  const parsed = Date.parse(value ?? "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function selectLibraryRecipes(recipes: Recipe[], query: string): Recipe[] {
  const needle = query.trim().toLocaleLowerCase();
  return recipes.filter((recipe) => {
    if (!needle) return true;
    const searchable = [recipe.title, ...recipe.ingredients.map((ingredient) => ingredient.name), ...recipe.tags]
      .join(" ").toLocaleLowerCase();
    return searchable.includes(needle);
  }).map((recipe, index) => ({ recipe, index }))
    .sort((a, b) => timestamp(b.recipe.createdAt) - timestamp(a.recipe.createdAt) || a.index - b.index)
    .map(({ recipe }) => recipe);
}
