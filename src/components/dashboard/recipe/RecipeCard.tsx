import { Clock } from "lucide-react";

import BrandMark from "../../BrandMark";
import { Card } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import type { Recipe } from "../../../types/recipe";

function sourceHost(url?: string) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export function RecipeCard({ recipe, onClick, photoClassName = "aspect-[4/3]" }: { recipe: Recipe; onClick: () => void; photoClassName?: string }) {
  const host = sourceHost(recipe.sourceUrl);
  return (
    <Card interactive className="h-full min-w-0">
      <button type="button" aria-label={`Open recipe: ${recipe.title}`} onClick={onClick}
        className="flex h-full w-full flex-col text-left focus-visible:-outline-offset-4">
        {/* shrink-0: the grid stretches cards to one height, which would otherwise squeeze the photo. */}
        <div className={`flex ${photoClassName} w-full shrink-0 items-center justify-center overflow-hidden bg-muted`}>
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : <BrandMark className="h-14 w-20 text-muted-foreground/50" />}
        </div>
        <div className="flex w-full flex-1 flex-col gap-2 px-4 py-4">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">{recipe.title}</h3>
          <p className="mt-auto flex min-w-0 items-center gap-3 whitespace-nowrap text-sm text-muted-foreground">
            {recipe.totalTime ? <span className="inline-flex shrink-0 items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{recipe.totalTime}</span> : null}
            {host ? <span className="min-w-0 truncate">{host}</span> : null}
          </p>
        </div>
      </button>
    </Card>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" role="status" aria-label="Loading recipe">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
    </div>
  );
}
