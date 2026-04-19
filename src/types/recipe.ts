export const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export type Ingredient = {
  id: string,
  name: string,
  amount?: string,
  unit?: string
}

export type Step = {
  id: string,
  text: string
}

export type Recipe = {
  id: string;
  title: string;
  category: RecipeCategory;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};
