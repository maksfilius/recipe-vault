import type { Recipe } from "../../../types/recipe";
import { Bookmark, ExternalLink } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { getRecipeCategoryStyles } from "../../../lib/recipe-category-theme";

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
};

export function RecipeCard({ recipe, onClick }: RecipeCardProps)  {
  const { tokens, gradientStyle, heroBackground, labelStyles, labelAccentStyles } =
    getRecipeCategoryStyles(recipe.category, recipe.image);
  const hasImage = Boolean(recipe.image);

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
        <div
          className={[
            "relative w-full overflow-hidden rounded-b-[1.5rem]",
            hasImage ? "h-40" : "h-16"
          ].join(" ")}
          style={heroBackground}
        >
          <div className={["absolute left-4 flex items-center gap-2", hasImage ? "top-4" : "top-1/2 -translate-y-1/2"].join(" ")}>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={labelStyles}
            >
              <span className="h-2 w-2 rounded-full" style={labelAccentStyles} />
              {tokens.name}
            </span>
          </div>
          {hasImage ? (
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/80 p-2 text-foreground transition hover:scale-105 hover:bg-background"
              aria-label="Save recipe"
              onClick={(event) => event.stopPropagation()}
            >
              <Bookmark className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <CardHeader className="gap-3 text-foreground">
          <CardTitle className="text-lg font-semibold text-foreground">{recipe.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {recipe.description}
          </CardDescription>
        </CardHeader>

        <CardFooter className="border-border/60 text-xs text-muted-foreground">
          <span>Updated {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}</span>
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md text-foreground/95 underline-offset-4 transition"
              onClick={(event) => event.stopPropagation()}
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
