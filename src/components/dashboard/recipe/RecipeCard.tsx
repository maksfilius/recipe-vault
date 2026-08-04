import { Bookmark, Clock3, ExternalLink, Utensils, Users } from "lucide-react";

import { Card } from "../../ui/card";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { formatSourceUrl } from "@/src/lib/utils";
import type { Recipe } from "../../../types/recipe";

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
  const visibleCollections = recipe.collections.slice(0, 2);

  return (
    <Card
      variant="subtle"
      interactive
      padding="none"
      className="animate-card-in relative h-full cursor-pointer overflow-hidden border-border/55 bg-card/82 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]"
      onClick={onClick}
    >
      <div className="relative grid h-40 w-full place-items-center overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.18),hsl(var(--muted)_/_0.72))]">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <Utensils className="h-11 w-11 text-foreground/30" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-background/10" />
        <button
          type="button"
          className={[
            "absolute right-3 top-3 rounded-full border p-2 transition hover:scale-105",
            isFavorite
              ? "border-amber-500/80 bg-amber-100 text-amber-700 shadow-lg dark:border-amber-400/70 dark:bg-amber-400/20 dark:text-amber-100"
              : "border-border/60 bg-card/90 text-foreground hover:bg-card",
          ].join(" ")}
          aria-label={isFavorite ? "Remove recipe from favorites" : "Add recipe to favorites"}
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(recipe.id);
          }}
        >
          <Bookmark className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
        </button>
      </div>

      <div className="flex h-[calc(100%-10rem)] flex-col p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{recipe.title}</h3>
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="truncate">from {formattedSourceUrl}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground/80">manual recipe</p>
          )}
        </div>

        {recipe.description ? (
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {recipe.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleCollections.map((collection) => (
            <span key={collection.id} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
              {collection.name}
            </span>
          ))}
          {recipe.collections.length > visibleCollections.length ? (
            <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
              +{recipe.collections.length - visibleCollections.length}
            </span>
          ) : null}
          {recipe.tags.slice(0, 1).map((tag) => (
            <span key={tag} className="rounded-full border border-border/60 bg-background/55 px-2.5 py-1 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {recipe.totalTime ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{recipe.totalTime}</span> : null}
          {recipe.servings ? <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{recipe.servings}</span> : null}
          {recipe.ingredients.length > 0 ? <span>{recipe.ingredients.length} ingredients</span> : null}
        </div>

        <div className="mt-auto pt-4 text-xs text-muted-foreground">
          Updated {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}
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
