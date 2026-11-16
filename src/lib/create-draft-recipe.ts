import type { ImportedRecipe, RecipeCollection } from "../types/recipe.ts";
import type { RecipeFormInitialValue } from "../components/dashboard/recipe/RecipeForm";

type DraftRecipeInput = Partial<ImportedRecipe> & { collectionIds?: string[] };

export function createDraftRecipe(partial: DraftRecipeInput | undefined, collections: RecipeCollection[]): RecipeFormInitialValue {
  const requestedIds = new Set(partial?.collectionIds ?? []);
  const suggestedName = partial?.suggestedCollection?.toLocaleLowerCase();
  const selectedCollections = collections.filter((collection) =>
    requestedIds.has(collection.id) ||
    (suggestedName && collection.name.toLocaleLowerCase() === suggestedName));

  return {
    id: `draft-import-${globalThis.crypto.randomUUID()}`,
    title: partial?.title ?? "",
    description: partial?.description ?? "",
    ingredients: partial?.ingredients ?? [],
    steps: partial?.steps ?? [],
    collections: selectedCollections,
    tags: partial?.tags ?? [],
    sourceUrl: partial?.sourceUrl,
    imageUrl: partial?.imageUrl,
    totalTime: partial?.totalTime,
    servings: partial?.servings,
    suggestedCollection: partial?.suggestedCollection,
  };
}
