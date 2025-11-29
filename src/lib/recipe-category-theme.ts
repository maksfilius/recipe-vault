import type { RecipeCategory } from "@/src/types/recipe";
import type { CSSProperties } from "react";

export type CategoryToken = {
  name: string;
  label: string;
  gradientStart: string;
  gradientEnd: string;
};

export const categoryTokens: Record<RecipeCategory, CategoryToken> = {
  breakfast: {
    name: "Breakfast",
    label: "--cat-breakfast-label",
    gradientStart: "--cat-breakfast-grad-start",
    gradientEnd: "--cat-breakfast-grad-end",
  },
  lunch: {
    name: "Lunch",
    label: "--cat-lunch-label",
    gradientStart: "--cat-lunch-grad-start",
    gradientEnd: "--cat-lunch-grad-end",
  },
  dinner: {
    name: "Dinner",
    label: "--cat-dinner-label",
    gradientStart: "--cat-dinner-grad-start",
    gradientEnd: "--cat-dinner-grad-end",
  },
  snack: {
    name: "Snack",
    label: "--cat-snack-label",
    gradientStart: "--cat-snack-grad-start",
    gradientEnd: "--cat-snack-grad-end",
  },
};

export function getRecipeCategoryStyles(category: RecipeCategory, image?: string) {
  const tokens = categoryTokens[category];

  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, hsl(var(${tokens.gradientStart})), hsl(var(${tokens.gradientEnd})))`,
  };

  const heroBackground: CSSProperties = image
    ? {
      backgroundImage: `linear-gradient(135deg, hsl(var(${tokens.gradientStart}) / 0.35), hsl(var(${tokens.gradientEnd}) / 0.8)), url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
    : {
      backgroundImage: `linear-gradient(135deg, hsl(var(${tokens.gradientStart}) / 0.35), hsl(var(${tokens.gradientEnd}) / 0.75))`,
    };

  const labelStyles: CSSProperties = {
    color: `hsl(var(${tokens.label}))`,
    borderColor: `hsl(var(${tokens.label}) / 0.45)`,
    backgroundColor: `hsl(var(${tokens.gradientStart}) / 0.2)`,
  };

  const labelAccentStyles: CSSProperties = {
    backgroundColor: `hsl(var(${tokens.label}))`,
  };

  const metaDotStyles: CSSProperties = {
    backgroundColor: `hsl(var(${tokens.gradientStart}))`,
  };

  return {
    tokens,
    gradientStyle,
    heroBackground,
    labelStyles,
    labelAccentStyles,
    metaDotStyles,
  };
}
