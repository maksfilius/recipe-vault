import {
  mapRowToCollection,
  type CollectionRow,
} from "@/src/lib/recipes";
import { supabase } from "@/src/lib/supabase-client";

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
