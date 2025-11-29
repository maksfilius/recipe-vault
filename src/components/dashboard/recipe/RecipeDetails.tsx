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

export function RecipeDetails({recipe, onBack, onEdit, onDelete}: RecipeDetailsProps) {
  const { tokens, heroBackground, labelStyles, labelAccentStyles, metaDotStyles } =
    getRecipeCategoryStyles(recipe.category, recipe.image);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-2 px-3" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to recipes
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 px-3" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-3 border border-red-400/40 text-red-300 hover:border-red-400 hover:text-red-200"
            onClick={onDelete}
          >
            <Trash className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card
        variant="subtle"
        padding="none"
        className="overflow-hidden border-border/70 bg-background/60"
      >
        <div className="relative h-64 w-full overflow-hidden" style={heroBackground}>
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