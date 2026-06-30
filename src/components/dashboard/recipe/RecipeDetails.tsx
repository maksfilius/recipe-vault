import { ArrowLeft, ExternalLink, Pencil, Trash, Utensils } from "lucide-react";

import { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
import { getRecipeCategoryStyles } from "../../../lib/recipe-category-theme";
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
  const formattedSourceUrl = recipe.sourceUrl ? formatSourceUrl(recipe.sourceUrl) : null;
  const { tokens, heroBackground, labelStyles, labelAccentStyles } =
    getRecipeCategoryStyles(recipe.category);

  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasSteps = recipe.steps && recipe.steps.length > 0;

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="w-fit gap-2 rounded-lg border border-border/60 bg-card/80 px-3 text-foreground transition hover:bg-card"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to recipes
        </Button>

        {showActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="gap-2 rounded-lg border border-border/60 bg-card/80 px-3 text-foreground transition hover:bg-card"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="ghost"
              className="gap-2 rounded-lg border border-red-400/40 bg-card/80 px-3 text-red-400 transition hover:border-red-400 hover:bg-card hover:text-red-300"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/70 bg-card/78 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]">
        <div
          className="relative grid min-h-56 place-items-center overflow-hidden px-6 py-10 text-center"
          style={heroBackground}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/20 to-background/42 dark:via-background/35 dark:to-background/70" />
          <div className="absolute left-5 top-5">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={labelStyles}
            >
              <span className="h-2 w-2 rounded-full" style={labelAccentStyles} />
              {tokens.name}
            </span>
          </div>
          <Utensils className="relative z-10 mb-5 h-12 w-12 text-foreground/36" />
          <h1 className="relative z-10 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {recipe.title}
          </h1>
          <p className="relative z-10 mt-3 text-sm text-muted-foreground">
            Updated {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}
          </p>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_0.85fr] lg:p-7">
          <section className="rounded-2xl border border-border/60 bg-background/45 p-5 shadow-inner shadow-background/20">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Description
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {recipe.description || "No description added yet."}
            </p>

            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/78 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-border hover:bg-card"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View source
                </span>
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {formattedSourceUrl}
                </span>
              </a>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-border/60 bg-card/60 px-3 py-2 text-sm text-muted-foreground">
                No source link added
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/45 p-5 shadow-inner shadow-background/20">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Ingredients
              </h2>
              {hasIngredients ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={labelStyles}
                >
                  {recipe.ingredients.length} item{recipe.ingredients.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {hasIngredients ? (
              <ul className="mt-4 space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="rounded-lg border border-border/50 bg-card/78 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {ingredient.amount !== undefined && ingredient.amount !== null ? (
                      <span className="font-semibold text-foreground">{ingredient.amount} </span>
                    ) : null}
                    {ingredient.unit ? (
                      <span className="font-semibold text-foreground">{ingredient.unit} </span>
                    ) : null}
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No ingredients added yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/45 p-5 shadow-inner shadow-background/20 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Steps
              </h2>
              {hasSteps ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={labelStyles}
                >
                  {recipe.steps.length} step{recipe.steps.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {hasSteps ? (
              <ol className="mt-4 grid gap-3">
                {recipe.steps.map((step, index) => (
                  <li
                    key={step.id}
                    className="flex gap-3 rounded-lg border border-border/50 bg-card/78 p-3"
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-semibold"
                      style={labelStyles}
                    >
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No steps added yet.</p>
            )}
          </section>
        </div>
      </article>
    </section>
  );
}
