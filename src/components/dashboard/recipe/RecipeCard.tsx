import type { Recipe } from "../../../types/recipe";
import { Bookmark, ExternalLink } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { getRecipeCategoryStyles } from "../../../lib/recipe-category-theme";
import { formatSourceUrl } from "@/src/lib/utils";

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
};

export function RecipeCard({
  recipe,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: RecipeCardProps) {
  const formattedSourceUrl = recipe.sourceUrl ? formatSourceUrl(recipe.sourceUrl) : null;
  const { tokens, gradientStyle, heroBackground, labelStyles, labelAccentStyles } =
    getRecipeCategoryStyles(recipe.category);

  return (
    <Card
      variant="subtle"
      interactive
      padding="none"
      className="animate-card-in relative h-full overflow-hidden border-border/55 bg-card/78 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]"
      style={gradientStyle}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--card)_/_0.5),hsl(var(--background)_/_0.18))] backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/12 to-background/38 dark:via-background/30 dark:to-background/70" />
      <div className="relative z-10 flex h-full flex-col bg-background/10 backdrop-blur-[1px]">
        <div
          className="relative h-16 w-full overflow-hidden"
          style={heroBackground}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/8 via-transparent to-background/20 dark:to-background/25" />
          <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={labelStyles}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-background/30" style={labelAccentStyles} />
              {tokens.name}
            </span>
          </div>
          <button
            type="button"
            className={[
              "absolute right-3 top-3 rounded-full border p-2 transition hover:scale-105",
              isFavorite
                ? "border-amber-500/80 bg-amber-100 text-amber-700 shadow-[0_10px_24px_hsl(35_92%_55%_/_0.28)] hover:bg-amber-200 dark:border-amber-400/70 dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/20"
                : "border-border/60 bg-card/88 text-foreground hover:bg-card"
            ].join(" ")}
            aria-label={isFavorite ? "Remove recipe from favorites" : "Add recipe to favorites"}
            aria-pressed={isFavorite}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite?.(recipe.id);
            }}
          >
            <Bookmark className={["h-4 w-4", isFavorite ? "fill-current" : ""].join(" ")} />
          </button>
        </div>

        <CardHeader className="gap-3 text-foreground">
          <CardTitle className="text-[24px] sm:text-2xl font-semibold text-foreground">{recipe.title}</CardTitle>
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
              {formattedSourceUrl}
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

export function RecipeCardSkeleton() {
  return (
    <div className="relative flex h-64 flex-col overflow-hidden rounded-2xl border border-border/55 bg-card/72 shadow-[0_22px_60px_hsl(var(--foreground)_/_0.08)]">
      <div className="absolute inset-0 animate-image-shimmer bg-gradient-to-r from-transparent via-foreground/6 to-transparent" />
      <div className="h-40 shrink-0 rounded-b-[1.5rem] bg-gradient-to-br from-muted/85 via-card to-muted/70" />
      <div className="flex flex-1 flex-col px-6 pb-4 pt-6 mb-4">
        <div className="h-6 w-24 rounded-full bg-foreground/10" />
        <div className="mt-2 mb-3 space-y-2">
          <div className="h-7 w-3/4 rounded-lg bg-foreground/12" />
          <div className="h-4 w-full rounded-lg bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}
