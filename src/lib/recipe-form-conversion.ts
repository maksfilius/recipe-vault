import { parseIngredientLine } from "./ingredient-line.ts";
import type { Ingredient, Recipe, Step } from "../types/recipe.ts";

export type RecipeFormValues = {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: Step[];
  collectionIds: string[];
  tags: string[];
  sourceUrl?: string;
  imageUrl?: string;
  totalTime?: string;
  servings?: string;
};

export function ingredientsToText(ingredients: Ingredient[]) {
  return ingredients.map((ingredient) =>
    [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ").trim(),
  ).join("\n");
}

export function ingredientTextToIngredients(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseIngredientLine);
}

export function stepsToText(steps: Step[]) {
  return steps.map((step) => step.text).join("\n");
}

export function stepTextToSteps(text: string): Step[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({
    id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    text: line,
  }));
}

export function buildRecipeFormValues(input: {
  title: string;
  ingredientText: string;
  stepText: string;
  description: string;
  sourceUrl: string;
  totalTime: string;
  servings: string;
  /** The photo as edited in the form; when the key is absent the initial photo is kept. */
  imageUrl?: string;
  initialValue?: Pick<Recipe, "collections" | "tags" | "imageUrl">;
}): RecipeFormValues {
  return {
    title: input.title.trim(),
    description: input.description.trim() || undefined,
    ingredients: ingredientTextToIngredients(input.ingredientText),
    steps: stepTextToSteps(input.stepText),
    collectionIds: input.initialValue?.collections.map((collection) => collection.id) ?? [],
    tags: [...(input.initialValue?.tags ?? [])],
    imageUrl: "imageUrl" in input ? input.imageUrl : input.initialValue?.imageUrl,
    sourceUrl: input.sourceUrl.trim() || undefined,
    totalTime: input.totalTime.trim() || undefined,
    servings: input.servings.trim() || undefined,
  };
}
