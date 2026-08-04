import { z } from "zod";

const MAX_IMAGE_DATA_URL_LENGTH = 1_500_000;

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

const imageUrlSchema = z
  .string()
  .trim()
  .max(MAX_IMAGE_DATA_URL_LENGTH, "Recipe image is too large.")
  .refine((value) => {
    if (!value) return true;
    if (/^data:image\/webp;base64,[a-z0-9+/=]+$/i.test(value)) return true;

    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a secure recipe image URL.");

const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .optional()
    .transform((value) => value || undefined);

const ingredientSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().max(200),
  amount: z.string().trim().max(50).optional(),
  unit: z.string().trim().max(50).optional(),
});

const stepSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().trim().max(5_000),
});

export const recipePayloadSchema = z.object({
  title: z.string().trim().min(1, "Recipe name is required.").max(160, "Recipe name is too long."),
  description: z.string().trim().min(1, "Description is required.").max(5_000, "Description is too long."),
  sourceUrl: sourceUrlSchema.optional().transform((value) => value || undefined),
  imageUrl: imageUrlSchema.optional().transform((value) => value || undefined),
  totalTime: optionalText(80, "Total time is too long."),
  servings: optionalText(80, "Servings are too long."),
  suggestedCollection: optionalText(80, "Suggested collection is too long."),
  collectionIds: z
    .array(z.string().uuid())
    .max(50, "Too many collections.")
    .default([])
    .transform((ids) => [...new Set(ids)]),
  tags: z
    .array(z.string().trim().min(1).max(60))
    .max(50, "Too many tags.")
    .default([])
    .transform((tags) => {
      const seen = new Set<string>();

      return tags.filter((tag) => {
        const normalized = tag.toLocaleLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    }),
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
