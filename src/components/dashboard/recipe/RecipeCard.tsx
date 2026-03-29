import { useState } from "react";
import type { Recipe } from "../../../types/recipe";
import { Bookmark, ExternalLink } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { getRecipeCategoryStyles } from "../../../lib/recipe-category-theme";

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
};

function RecipeCardHeroImage({ src }: { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <div className="absolute inset-0 animate-image-shimmer bg-gradient-to-br from-white/8 via-white/18 to-transparent opacity-60" />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={[
          "absolute inset-0 h-full w-full object-cover transition duration-700 ease-out",
          isLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
        ].join(" ")}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
    </>
  );
}

export function RecipeCard({
  recipe,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: RecipeCardProps) {
  const { tokens, gradientStyle, heroBackground, labelStyles, labelAccentStyles } =
    getRecipeCategoryStyles(recipe.category, recipe.image);
  const hasImage = Boolean(recipe.image);

  return (
    <Card
      variant="subtle"
      interactive
      padding="none"
      className="animate-card-in relative h-full overflow-hidden border-border/60 bg-card/75 text-foreground shadow-[0_35px_90px_hsl(var(--background)_/_0.75)]"
      style={gradientStyle}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-card/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/70" />
      <div className="relative z-10 flex h-full flex-col bg-background/5 backdrop-blur-[1px]">
        <div
          className={[
            "relative w-full overflow-hidden rounded-b-[1.5rem]",
            hasImage ? "h-40" : "h-16"
          ].join(" ")}
          style={hasImage ? gradientStyle : heroBackground}
        >
          {hasImage ? (
            <>
              <RecipeCardHeroImage key={recipe.image} src={recipe.image!} />
            </>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-background/5 via-transparent to-background/25" />
          <div className={["absolute left-4 flex items-center gap-2", hasImage ? "top-4" : "top-1/2 -translate-y-1/2"].join(" ")}>
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
            className={[
              "absolute right-3 top-3 rounded-full border p-2 transition hover:scale-105",
              isFavorite
                ? "border-amber-400/70 bg-amber-400/15 text-amber-200 hover:bg-amber-400/20"
                : "border-border/60 bg-background/80 text-foreground hover:bg-background"
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
          <CardTitle className="text-3xl sm:text-2xl font-semibold text-foreground">{recipe.title}</CardTitle>
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

export function RecipeCardSkeleton() {
  return (
    <div className="relative flex h-64 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/55 shadow-[0_25px_65px_hsl(var(--background)_/_0.45)]">
      <div className="absolute inset-0 animate-image-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="h-40 shrink-0 rounded-b-[1.5rem] bg-gradient-to-br from-muted/80 via-card/90 to-muted/60" />
      <div className="flex flex-1 flex-col px-6 pb-4 pt-6 mb-4">
        <div className="h-6 w-24 rounded-full bg-foreground/10" />
        <div className="mt-2 mb-3 space-y-2">
          <div className="h-7 w-3/4 rounded-lg bg-foreground/12" />
        </div>
      </div>
    </div>
  );
}
