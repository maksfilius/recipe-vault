export const DEFAULT_COLLECTION_NAMES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

export type Ingredient = {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
};

export type Step = {
  id: string;
  text: string;
};

export type RecipeCollection = {
  id: string;
  name: string;
  position: number;
  createdAt?: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  collections: RecipeCollection[];
  tags: string[];
  sourceUrl?: string;
  imageUrl?: string;
  totalTime?: string;
  servings?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ImportedRecipe = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl: string;
  imageUrl?: string;
  totalTime?: string;
  servings?: string;
  tags: string[];
  suggestedCollection?: string;
};
