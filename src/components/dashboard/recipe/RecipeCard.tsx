import type { Recipe } from "../../../types/recipe";
import { Bookmark, ExternalLink, MoreHorizontal, Utensils } from "lucide-react";
import { Card } from "../../ui/card";
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
      className="animate-card-in relative h-full cursor-pointer overflow-hidden border-border/55 bg-card/78 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]"
      style={gradientStyle}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--card)_/_0.5),hsl(var(--background)_/_0.18))] backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/12 to-background/38 dark:via-background/30 dark:to-background/70" />
      <div className="relative z-10 flex h-full flex-col bg-background/10 backdrop-blur-[1px]">
        <div
          className="relative grid h-40 w-full place-items-center overflow-hidden"
          style={heroBackground}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/8 via-transparent to-background/20 dark:to-background/25" />
          <Utensils className="relative z-10 h-11 w-11 text-foreground/35" />
          <div className="absolute left-3 top-3 flex items-center gap-2">
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

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{recipe.title}</h3>
              {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="truncate">from {formattedSourceUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground/80">from manual</p>
              )}
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-foreground"
              aria-label="Recipe actions"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {recipe.description ? (
            <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
              {recipe.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={labelStyles}
            >
              <span className="h-2 w-2 rounded-full border border-background/30" style={labelAccentStyles} />
              {tokens.name}
            </span>
            {recipe.ingredients.length > 0 ? (
              <span className="rounded-full border border-border/60 bg-card/72 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {recipe.ingredients.length} ingredients
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-4 text-xs text-muted-foreground">
            Updated {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="relative flex h-80 flex-col overflow-hidden rounded-2xl border border-border/55 bg-card/72 shadow-[0_22px_60px_hsl(var(--foreground)_/_0.08)]">
      <div className="absolute inset-0 animate-image-shimmer bg-gradient-to-r from-transparent via-foreground/6 to-transparent" />
      <div className="h-40 shrink-0 bg-gradient-to-br from-muted/85 via-card to-muted/70" />
      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded-lg bg-foreground/12" />
          <div className="h-4 w-1/2 rounded-lg bg-foreground/10" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded-lg bg-foreground/10" />
          <div className="h-4 w-2/3 rounded-lg bg-foreground/10" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-20 rounded-full bg-foreground/10" />
          <div className="h-6 w-24 rounded-full bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}
