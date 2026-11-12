import type { RecipePayload } from "./recipe-validation.ts";

export function toSaveRecipeRpcArgs(values: RecipePayload, recipeId: string, imageUrl?: string) {
  return {
    p_recipe_id: recipeId,
    p_title: values.title,
    p_description: values.description ?? null,
    p_ingredients: values.ingredients,
    p_steps: values.steps,
    p_image_url: imageUrl ?? null,
    p_source_url: values.sourceUrl ?? null,
    p_total_time: values.totalTime ?? null,
    p_servings: values.servings ?? null,
    p_tags: values.tags,
    p_collection_ids: values.collectionIds,
  };
}
