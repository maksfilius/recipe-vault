import type {
  Ingredient,
  Recipe,
  RecipeCollection,
  Step,
} from "../types/recipe.ts";

export type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string | null;
};

export type RecipeCollectionRelationRow = {
  collection: CollectionRow | null;
};

export type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: Ingredient[] | null;
  steps: Step[] | null;
  image_url: string | null;
  source_url: string | null;
  total_time: string | null;
  servings: string | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  recipe_collections?: RecipeCollectionRelationRow[] | null;
};

export function mapRowToCollection(row: CollectionRow): RecipeCollection {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    createdAt: row.created_at ?? undefined,
  };
}

export function mapRowToRecipe(
  row: RecipeRow,
  collectionFallback: RecipeCollection[] = [],
): Recipe {
  const relatedCollections = (row.recipe_collections ?? [])
    .map((relation) => relation.collection)
    .filter((collection): collection is CollectionRow => Boolean(collection))
    .map(mapRowToCollection)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    collections: relatedCollections.length > 0 ? relatedCollections : collectionFallback,
    tags: row.tags ?? [],
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    totalTime: row.total_time ?? undefined,
    servings: row.servings ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? row.created_at ?? undefined,
  };
}
