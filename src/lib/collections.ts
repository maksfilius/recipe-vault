import {
  mapRowToCollection,
  type CollectionRow,
} from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";
import type { RecipeCollection } from "@/src/types/recipe";

export async function fetchRecipeCollections(userId: string) {
  const { data, error } = await supabase
    .from("collections")
    .select("id, user_id, name, position, created_at")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as CollectionRow[]).map(mapRowToCollection);
}

export async function createRecipeCollection(
  userId: string,
  name: string,
  position: number,
): Promise<RecipeCollection> {
  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: name.trim(),
      position,
    })
    .select("id, user_id, name, position, created_at")
    .single();

  if (error || !data) throw error ?? new Error("Collection was not created.");
  return mapRowToCollection(data as CollectionRow);
}

export async function deleteRecipeCollection(collectionId: string) {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) throw error;
}
