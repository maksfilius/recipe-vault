import type { Recipe, RecipeCategory, Ingredient, Step } from '@/src/types/recipe';

export type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: RecipeCategory;
  ingredients: Ingredient[] | null;
  steps: Step[] | null;
  image_url: string | null;
  source_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function mapRowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? '',
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    image: row.image_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? row.created_at ?? undefined,
  };
}
