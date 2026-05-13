import { z } from "zod";

import { RECIPE_CATEGORIES } from "../types/recipe.ts";

const sourceUrlSchema = z
  .string()
  .trim()
  .max(2048, "Source link is too long.")
  .refine((value) => {
    if (!value) return true;

    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a valid http or https URL.");

const ingredientSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().max(200),
  amount: z.number().finite().min(0).max(1_000_000).optional(),
  unit: z.string().trim().max(50).optional(),
});

const stepSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().trim().max(5_000),
});

export const recipePayloadSchema = z.object({
  title: z.string().trim().min(1, "Recipe name is required.").max(160, "Recipe name is too long."),
  category: z.enum(RECIPE_CATEGORIES),
  description: z.string().trim().min(1, "Description is required.").max(5_000, "Description is too long."),
  sourceUrl: sourceUrlSchema.optional().transform((value) => value || undefined),
  ingredients: z
    .array(ingredientSchema)
    .max(100, "Too many ingredients.")
    .transform((items) =>
      items.filter((item) => item.name || item.amount !== undefined || (item.unit ?? "").trim()),
    ),
  steps: z
    .array(stepSchema)
    .max(100, "Too many steps.")
    .transform((items) => items.filter((item) => item.text)),
});

export type RecipePayload = z.infer<typeof recipePayloadSchema>;
