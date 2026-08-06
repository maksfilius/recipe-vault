"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Pencil,
  Trash,
  Utensils,
  Users,
} from "lucide-react";

import { CookingMode } from "./CookingMode";
import type { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { requestAppFullscreen } from "@/src/lib/fullscreen";
import { formatSourceUrl } from "@/src/lib/utils";

type RecipeDetailsProps = {
  recipe: Recipe;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
};

export function RecipeDetails({
  recipe,
  onBack,
  onEdit,
  onDelete,
  showActions = true,
}: RecipeDetailsProps) {
  const [isCooking, setIsCooking] = useState(false);
  const formattedSourceUrl = recipe.sourceUrl ? formatSourceUrl(recipe.sourceUrl) : null;
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;

  if (isCooking) {
    return <CookingMode recipe={recipe} onExit={() => setIsCooking(false)} />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
        <Button variant="ghost" className="gap-2 border border-border/60 bg-card/80" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to recipes</span>
          <span className="sm:hidden">Back</span>
        </Button>
        {showActions ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" aria-label="Edit recipe" className="gap-2 border border-border/60 bg-card/80" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="ghost" aria-label="Delete recipe" className="gap-2 border border-destructive/45 bg-card/80 text-destructive" onClick={onDelete}>
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/70 bg-card/82 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]">
        <div className="relative grid min-h-56 place-items-center overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.2),hsl(var(--muted)_/_0.72))] px-4 py-10 text-center sm:min-h-64 sm:px-6 sm:py-12">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/55 to-background/88" />
          {!recipe.imageUrl ? <Utensils className="relative z-10 mb-4 h-12 w-12 text-foreground/35" /> : null}
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {recipe.collections.map((collection) => (
                <span key={collection.id} className="rounded-full border border-primary/30 bg-background/75 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {collection.name}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{recipe.title}</h1>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {recipe.totalTime ? <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{recipe.totalTime}</span> : null}
              {recipe.servings ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{recipe.servings}</span> : null}
              <span>Updated {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}</span>
            </div>

            {hasSteps ? (
              <Button
                type="button"
                className="mt-5 h-12 px-6"
                onClick={() => {
                  // Requested here, inside the gesture: by the time cooking mode
                  // has mounted the browser no longer treats it as user-initiated.
                  void requestAppFullscreen();
                  setIsCooking(true);
                }}
              >
                Start cooking
              </Button>
            ) : null}
          </div>
        </div>

        {/* Mobile drops the outer padding and the inner card chrome: four nested
            paddings left the text column barely 250px wide on a phone. */}
        <div className="grid gap-0 p-0 sm:gap-6 sm:p-5 lg:grid-cols-[1fr_.85fr] lg:p-7">
          <section className="border-t border-border/60 bg-background/45 p-4 sm:rounded-2xl sm:border sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Description</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {recipe.description || "No description added yet."}
            </p>
            {recipe.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-xs text-muted-foreground">#{tag}</span>
                ))}
              </div>
            ) : null}
            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/78 px-3 py-2 text-sm font-semibold transition hover:border-border"
              >
                <span className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />View source</span>
                <span className="truncate text-xs font-medium text-muted-foreground">{formattedSourceUrl}</span>
              </a>
            ) : null}
          </section>

          <section className="border-t border-border/60 bg-background/45 p-4 sm:rounded-2xl sm:border sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Ingredients</h2>
              {hasIngredients ? <span className="text-xs text-muted-foreground">{recipe.ingredients.length} items</span> : null}
            </div>
            {hasIngredients ? (
              <ul className="mt-2 divide-y divide-border/40 sm:mt-4 sm:space-y-2 sm:divide-y-0">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="py-2 text-sm text-muted-foreground sm:rounded-lg sm:border sm:border-border/50 sm:bg-card/78 sm:px-3">
                    {ingredient.amount ? <span className="font-semibold text-foreground">{ingredient.amount} </span> : null}
                    {ingredient.unit ? <span className="font-semibold text-foreground">{ingredient.unit} </span> : null}
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted-foreground">No ingredients added yet.</p>}
          </section>

          <section className="border-t border-border/60 bg-background/45 p-4 sm:rounded-2xl sm:border sm:p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Steps</h2>
              {hasSteps ? <span className="text-xs text-muted-foreground">{recipe.steps.length} steps</span> : null}
            </div>
            {/* Phones float the step number so the text wraps back under it after
                the first line. Its 24px box matches leading-6 exactly, so the second
                line starts at the left edge instead of half-indented. From sm up the
                row is a flex column again, where floats are ignored and the tidier
                alignment costs nothing. */}
            {hasSteps ? (
              <ol className="mt-2 divide-y divide-border/40 sm:mt-4 sm:grid sm:gap-3 sm:divide-y-0">
                {recipe.steps.map((step, index) => (
                  <li key={step.id} className="flow-root py-3 sm:flex sm:gap-3 sm:rounded-lg sm:border sm:border-border/50 sm:bg-card/78 sm:p-3">
                    <span className="float-left mr-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary/10 text-xs font-semibold sm:float-none sm:mr-0 sm:h-7 sm:w-7 sm:text-sm">{index + 1}</span>
                    <p className="text-sm leading-6 text-muted-foreground sm:pt-1">{step.text}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-4 text-sm text-muted-foreground">No steps added yet.</p>}
          </section>
        </div>
      </article>
    </section>
  );
}
