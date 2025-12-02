export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Ingredient = {
  id: string,
  name: string,
  amount?: number,
  unit?: string
}

export type Step = {
  id: string,
  text: string
}

export type Recipe = {
  id: number;
  title: string;
  category: RecipeCategory;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  image?: string;
  sourceUrl?: string;
};
