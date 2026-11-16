
import { mapRowToRecipe, type RecipeRow } from "./recipes.ts";
import type { Recipe } from "../types/recipe.ts";

export async function resolveExistingRecipe(
  sourceUrl: string,
  currentRecipeId: string | null,
  findSavedRow: (sourceUrl: string) => Promise<RecipeRow | null>,
): Promise<Recipe | null> {
  const savedRow = await findSavedRow(sourceUrl);
  if (!savedRow || savedRow.id === currentRecipeId) return null;
  return mapRowToRecipe(savedRow);
}

export async function prepareRecipeImport<T>(
  sourceUrl: string,
  findSavedRow: (sourceUrl: string) => Promise<RecipeRow | null>,
  importSource: (sourceUrl: string) => Promise<T>,
): Promise<{ kind: "existing"; recipe: Recipe } | { kind: "draft"; recipe: T }> {
  const existing = await resolveExistingRecipe(sourceUrl, null, findSavedRow);
  if (existing) return { kind: "existing", recipe: existing };
  return { kind: "draft", recipe: await importSource(sourceUrl) };
}
