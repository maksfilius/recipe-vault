import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChefHat, ExternalLink, Pencil, Trash } from "lucide-react";

import { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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
  const { tokens, heroBackground, labelStyles, labelAccentStyles, metaDotStyles } =
    getRecipeCategoryStyles(recipe.category);

  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasSteps = recipe.steps && recipe.steps.length > 0;

  const [isPinned, setIsPinned] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentStep = hasSteps ? recipe.steps[currentStepIndex] : null;

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
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const startCooking = () => {
    if (!hasSteps) return;
    setCurrentStepIndex(0);
    setIsCookingMode(true);
  };

  const goToPreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1));
  };

  return (
    <section className="mx-auto flex w-full flex-col gap-6">
      <div ref={sentinelRef} aria-hidden="true" className="h-0" />

      <div
        className={[
          "sticky top-0 z-20 flex flex-wrap items-center gap-3 transition-all duration-300",
          isPinned ? "justify-between bg-background/70 px-4 py-2 backdrop-blur shadow-lg" : "justify-between",
        ].join(" ")}
      >
        <Button
          variant="ghost"
          size={isPinned ? "icon" : "sm"}
          className={[
            "gap-2 transition-all duration-200",
            isPinned ? "rounded-full bg-background/80 shadow-md" : "px-3",
          ].join(" ")}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {!isPinned && <span>Back to recipes</span>}
        </Button>

        {showActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size={isPinned ? "icon" : "sm"}
              className={[
                "gap-2 transition-all duration-200",
                isPinned ? "rounded-full bg-background/80 shadow-md" : "px-3",
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
                isPinned ? "rounded-full bg-background/80 shadow-md" : "px-3",
              ].join(" ")}
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
              {!isPinned && <span>Delete</span>}
            </Button>
          </div>
        ) : null}
      </div>

      {isCookingMode && currentStep ? (
        <Card variant="subtle" padding="none" className="overflow-hidden border-border/70 bg-background/70">
          <div className="border-b border-border/60 bg-card/60 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                  <ChefHat className="h-3.5 w-3.5" />
                  Cooking mode
                </div>
                <p className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {recipe.steps.length}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCookingMode(false)}>
                Exit cooking mode
              </Button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${((currentStepIndex + 1) / recipe.steps.length) * 100}%` }}
              />
            </div>
          </div>

          <CardContent className="grid gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-2xl border border-border/60 bg-foreground/[0.03] p-5 shadow-inner shadow-background/20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Up now
              </p>
              <p className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {currentStepIndex + 1}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {recipe.steps.length - currentStepIndex - 1} step
                {recipe.steps.length - currentStepIndex - 1 === 1 ? "" : "s"} remaining
              </p>

              {hasIngredients ? (
                <div className="mt-6 rounded-xl border border-border/50 bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Ingredients
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {recipe.ingredients.slice(0, 6).map((ingredient) => (
                      <li key={ingredient.id} className="truncate">
                        {ingredient.amount !== undefined && ingredient.amount !== null ? `${ingredient.amount} ` : ""}
                        {ingredient.unit ? `${ingredient.unit} ` : ""}
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                  {recipe.ingredients.length > 6 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      +{recipe.ingredients.length - 6} more ingredients
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-inner shadow-background/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current step
              </p>
              <p className="mt-4 text-xl leading-relaxed text-foreground sm:text-2xl">
                {currentStep.text}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  className="min-w-28"
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="min-w-32"
                  onClick={goToNextStep}
                  disabled={currentStepIndex === recipe.steps.length - 1}
                >
                  {currentStepIndex === recipe.steps.length - 1 ? "Done" : "Next step"}
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {recipe.steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    className={[
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
                      index === currentStepIndex
                        ? "border-primary/40 bg-primary/15 text-foreground"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                    onClick={() => setCurrentStepIndex(index)}
                    aria-label={`Go to step ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="subtle" padding="none" className="overflow-hidden border-border/70 bg-background/60">
          <div className="relative h-16 w-full overflow-hidden" style={heroBackground}>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/35 to-background/75" />
            <div className="absolute left-6 top-1/2 flex -translate-y-1/2 items-center gap-2">
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

          <CardContent className="grid gap-6 px-4 pb-8 pt-0 sm:px-6 md:grid-cols-[1fr_0.55fr] md:gap-10">
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-foreground/[0.03] p-5 shadow-inner shadow-background/20">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full" style={metaDotStyles} />
                  <span className="text-sm font-semibold">Description</span>
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
                  className="flex w-full min-w-0 flex-col items-start gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-border hover:bg-background sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>View source</span>
                  </div>
                  <span className="w-full text-xs text-muted-foreground break-all sm:w-auto sm:max-w-[55%] sm:truncate sm:break-normal">
                    {formattedSourceUrl}
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
                      <li key={ingredient.id} className="flex items-baseline gap-2">
                        <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-muted-foreground/80" />
                        <span className="text-foreground">
                          {ingredient.amount !== undefined && ingredient.amount !== null ? (
                            <span className="font-medium">{ingredient.amount} </span>
                          ) : null}
                          {ingredient.unit ? <span className="font-medium">{ingredient.unit} </span> : null}
                          <span className="break-words">{ingredient.name}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No ingredients added yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-foreground/[0.03] p-5 text-sm text-muted-foreground shadow-inner shadow-background/25">
              <h3 className="text-sm font-semibold text-foreground">Quick facts</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-foreground/70">Last updated</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatRelativeTime(recipe.updatedAt ?? recipe.createdAt)}
                  </p>
                </div>
                {hasSteps ? (
                  <Button variant="primary" size="md" className="w-full rounded-xl" onClick={startCooking}>
                    <ChefHat className="h-4 w-4" />
                    Start cooking
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 shadow-inner shadow-background/15 md:col-span-2">
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
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground">
                        {index + 1}
                      </span>
                      <p className="break-words text-sm leading-relaxed text-muted-foreground">
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No steps added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
