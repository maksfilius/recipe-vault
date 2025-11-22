import type { CSSProperties } from "react";
import type { Recipe, RecipeCategory } from "../../../types/recipe";
import { Bookmark, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";

const categoryTokens: Record<
  RecipeCategory,
  { name: string; label: string; gradientStart: string; gradientEnd: string }
> = {
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

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
};

export function RecipeCard({ recipe, onClick }: RecipeCardProps)  {
  const tokens = categoryTokens[recipe.category];
  const hasImage = Boolean(recipe.image);

  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, hsl(var(${tokens.gradientStart})), hsl(var(${tokens.gradientEnd})))`,
  };

  const heroBackground: CSSProperties = hasImage
    ? {
        backgroundImage: `linear-gradient(135deg, hsl(var(${tokens.gradientStart}) / 0.35), hsl(var(${tokens.gradientEnd}) / 0.8)), url(${recipe.image})`,
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

  return (
    <Card
      variant="subtle"
      interactive
      padding="none"
      className="relative h-full overflow-hidden border-border/60 bg-transparent text-foreground shadow-[0_35px_90px_hsl(var(--background)_/_0.75)]"
      style={gradientStyle}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/70" />
      <div className="relative z-10 flex h-full flex-col bg-background/5 backdrop-blur-[1px]">
        <div className="relative h-40 w-full overflow-hidden rounded-b-[1.5rem]" style={heroBackground}>
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={labelStyles}
            >
              <span className="h-2 w-2 rounded-full" style={labelAccentStyles} />
              {tokens.name}
            </span>
          </div>

          <button
            type="button"
            className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/80 p-2 text-foreground transition hover:scale-105 hover:bg-background"
            aria-label="Save recipe"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        <CardHeader className="gap-3 text-foreground">
          <CardTitle className="text-lg font-semibold text-foreground">{recipe.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</CardDescription>
        </CardHeader>

        <CardContent className="px-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={metaDotStyles} />
            {tokens.name}
          </div>
        </CardContent>

        <CardFooter className="border-border/60 text-xs text-muted-foreground">
          <span>Updated just now</span>
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary transition hover:text-primary/80"
            >
              View source
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground/80">No source link</span>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
