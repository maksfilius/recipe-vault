import type { ImportedRecipe, RecipeCollection } from "../types/recipe.ts";
import type { RecipeFormInitialValue } from "../components/dashboard/recipe/RecipeForm";

import type { ImportDraft } from "./import-draft.ts";

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

export function draftRecipeToValues(recipe: RecipeFormInitialValue): ImportDraft["values"] {
  return {
    title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, steps: recipe.steps,
    collectionIds: recipe.collections.map((collection) => collection.id), tags: recipe.tags,
    sourceUrl: recipe.sourceUrl, imageUrl: recipe.imageUrl, totalTime: recipe.totalTime, servings: recipe.servings,
    suggestedCollection: recipe.suggestedCollection,
  };
}
