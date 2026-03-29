import { supabase } from "@/src/lib/supabase-client";

export type FavoriteRecipeRow = {
  recipe_id: string;
};

export async function fetchFavoriteRecipeIds(userId: string) {
  const { data, error } = await supabase
    .from("favorite_recipes")
    .select("recipe_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Set((data as FavoriteRecipeRow[] | null ?? []).map((row) => row.recipe_id));
}

export async function addFavoriteRecipe(userId: string, recipeId: string) {
  const { error } = await supabase
    .from("favorite_recipes")
    .insert({
      user_id: userId,
      recipe_id: recipeId,
    });

  if (error) {
    throw error;
  }
}

export async function removeFavoriteRecipe(userId: string, recipeId: string) {
  const { error } = await supabase
    .from("favorite_recipes")
    .delete()
    .eq("user_id", userId)
    .eq("recipe_id", recipeId);

  if (error) {
    throw error;
  }
}
