import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Trash } from "lucide-react";

import { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { getRecipeCategoryStyles } from "../../../lib/recipe-category-theme";

type RecipeDetailsProps = {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RecipeDetails({ recipe, onBack, onEdit, onDelete }: RecipeDetailsProps) {
  const { tokens, heroBackground, labelStyles, labelAccentStyles, metaDotStyles } =
    getRecipeCategoryStyles(recipe.category, recipe.image);

  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasSteps = recipe.steps && recipe.steps.length > 0;

  const [isPinned, setIsPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-4px 0px 0px 0px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6">
      <div ref={sentinelRef} aria-hidden="true" className="h-0" />

      <div
        className={[
          "sticky top-0 z-20 flex flex-wrap items-center gap-3 transition-all duration-300",
          isPinned
            ? "justify-between rounded-2xl bg-background/70 px-4 py-2 backdrop-blur shadow-lg mx-5"
            : "justify-between"
        ].join(" ")}
      >
        <Button
          variant="ghost"
          size={isPinned ? "icon" : "sm"}
          className={[
            "gap-2 transition-all duration-200",
            isPinned ? "rounded-full bg-background/80 shadow-md" : "px-3"
          ].join(" ")}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {!isPinned && <span>Back to recipes</span>}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size={isPinned ? "icon" : "sm"}
            className={[
              "gap-2 transition-all duration-200",
              isPinned ? "rounded-full bg-background/80 shadow-md" : "px-3"
            ].join(" ")}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            {!isPinned && <span>Edit</span>}
          </Button>

          <Button
            variant="ghost"
            size={isPinned ? "icon" : "sm"}
            className={[
              "gap-2 border border-red-400/40 text-red-300 transition-all duration-200 hover:border-red-400 hover:text-red-200",
              isPinned
                ? "rounded-full bg-background/80 shadow-md"
                : "px-3"
            ].join(" ")}
            onClick={onDelete}
          >
            <Trash className="h-4 w-4" />
            {!isPinned && <span>Delete</span>}
          </Button>
        </div>
      </div>

      <Card
        variant="subtle"
        padding="none"
        className="overflow-hidden border-border/70 bg-background/60"
      >
        <div className="relative h-32 w-full overflow-hidden" style={heroBackground}>
          <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/35 to-background/75" />
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={labelStyles}
            >
              <span className="h-2 w-2 rounded-full" style={labelAccentStyles} />
              {tokens.name}
            </span>
          </div>
        </div>

        <CardHeader className="gap-3">
          <CardTitle className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {recipe.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 pb-8 md:grid-cols-[1fr_0.55fr] md:gap-10">
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-foreground/[0.03] p-5 shadow-inner shadow-background/20">
              <div className="flex items-center gap-2 text-foreground">
                <span className="h-2 w-2 rounded-full" style={metaDotStyles} />
                <span className="text-sm font-semibold">Recipe notes</span>
              </div>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {recipe.description || "Add a description to tell people how to enjoy this dish."}
              </p>
            </div>

            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-border hover:bg-background"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>View source</span>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {recipe.sourceUrl}
                </span>
              </a>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-foreground/[0.02] px-4 py-3 text-sm text-muted-foreground">
                <span>No source link added</span>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 shadow-inner shadow-background/15">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Ingredients</span>
                {hasIngredients && (
                  <span className="text-xs text-muted-foreground">
                    {recipe.ingredients.length} item{recipe.ingredients.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {hasIngredients ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {recipe.ingredients.map((ingredient) => (
                    <li
                      key={ingredient.id}
                      className="flex items-baseline gap-2"
                    >
                      <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
                      <span className="text-foreground">
                        {ingredient.amount !== undefined && ingredient.amount !== null && (
                          <span className="font-medium">
                            {ingredient.amount}{" "}
                          </span>
                        )}
                        {ingredient.unit && (
                          <span className="font-medium">
                            {ingredient.unit}{" "}
                          </span>
                        )}
                        <span>{ingredient.name}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No ingredients added yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 shadow-inner shadow-background/15">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Steps</span>
                {hasSteps && (
                  <span className="text-xs text-muted-foreground">
                    {recipe.steps.length} step{recipe.steps.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {hasSteps ? (
                <ol className="mt-3 space-y-3">
                  {recipe.steps.map((step, index) => (
                    <li key={step.id} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No steps added yet.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-foreground/[0.03] p-5 text-sm text-muted-foreground shadow-inner shadow-background/25">
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">Category</span>
              <span className="text-foreground font-medium">{tokens.name}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">Last updated</span>
              <span className="text-foreground">Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}