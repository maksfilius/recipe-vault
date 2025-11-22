export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Recipe = {
  id: number;
  title: string;
  category: RecipeCategory;
  description: string;
  image?: string;
  sourceUrl?: string;
};
