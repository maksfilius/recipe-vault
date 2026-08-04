import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Pencil,
  Trash,
  Utensils,
  Users,
} from "lucide-react";

import type { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { formatRelativeTime } from "@/src/lib/format-relative-time";
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
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="w-fit gap-2 border border-border/60 bg-card/80" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to recipes
        </Button>
        {showActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" className="gap-2 border border-border/60 bg-card/80" onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" className="gap-2 border border-red-400/40 bg-card/80 text-red-400" onClick={onDelete}>
              <Trash className="h-4 w-4" /> Delete
            </Button>
          </div>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/70 bg-card/82 text-foreground shadow-[0_28px_72px_hsl(var(--foreground)_/_0.1)]">
        <div className="relative grid min-h-64 place-items-center overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.2),hsl(var(--muted)_/_0.72))] px-6 py-12 text-center">
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
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_.85fr] lg:p-7">
          <section className="rounded-2xl border border-border/60 bg-background/45 p-5">
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

          <section className="rounded-2xl border border-border/60 bg-background/45 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Ingredients</h2>
              {hasIngredients ? <span className="text-xs text-muted-foreground">{recipe.ingredients.length} items</span> : null}
            </div>
            {hasIngredients ? (
              <ul className="mt-4 space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="rounded-lg border border-border/50 bg-card/78 px-3 py-2 text-sm text-muted-foreground">
                    {ingredient.amount ? <span className="font-semibold text-foreground">{ingredient.amount} </span> : null}
                    {ingredient.unit ? <span className="font-semibold text-foreground">{ingredient.unit} </span> : null}
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted-foreground">No ingredients added yet.</p>}
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/45 p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Steps</h2>
              {hasSteps ? <span className="text-xs text-muted-foreground">{recipe.steps.length} steps</span> : null}
            </div>
            {hasSteps ? (
              <ol className="mt-4 grid gap-3">
                {recipe.steps.map((step, index) => (
                  <li key={step.id} className="flex gap-3 rounded-lg border border-border/50 bg-card/78 p-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary/10 text-sm font-semibold">{index + 1}</span>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
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
