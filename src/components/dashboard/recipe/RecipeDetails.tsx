"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ExternalLink, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { CookingMode } from "./CookingMode";
import type { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import { requestAppFullscreen } from "@/src/lib/fullscreen";
import { formatServingsLabel, getVisibleRecipeDescription } from "@/src/lib/recipe-details";
import { formatSourceUrl } from "@/src/lib/utils";
import { trackAnalytics } from "@/src/lib/analytics";

type RecipeDetailsProps = {
  recipe: Recipe;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showFirstCookHint?: boolean;
  onDismissFirstCookHint?: () => void;
};

export function RecipeDetails({ recipe, onBack, onEdit, onDelete, showActions = true,
  showFirstCookHint = false, onDismissFirstCookHint }: RecipeDetailsProps) {
  const [isCooking, setIsCooking] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const startCookingRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const visibleSteps = recipe.steps.filter((step) => step.text.trim());
  const sourceHost = recipe.sourceUrl ? formatSourceUrl(recipe.sourceUrl) : null;
  const description = getVisibleRecipeDescription(recipe);

  useEffect(() => {
    if (actionsOpen) firstActionRef.current?.focus();
  }, [actionsOpen]);
  useEffect(() => {
    if (!actionsOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [actionsOpen]);

  const onActionsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && actionsOpen) {
      event.preventDefault();
      setActionsOpen(false);
      actionsButtonRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!actionsOpen) {
      setActionsOpen(true);
      return;
    }
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    items[next].focus();
  };

  if (isCooking) return <CookingMode recipe={{ ...recipe, steps: visibleSteps }} onExit={() => {
    setIsCooking(false);
    requestAnimationFrame(() => startCookingRef.current?.focus());
  }} />;

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" aria-label="Back to recipes" onClick={onBack}>
          <ArrowLeft aria-hidden />Recipes
        </Button>
        {showActions && (onEdit || onDelete) ? (
          <div ref={actionsRef} className="relative" onKeyDown={onActionsKeyDown} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setActionsOpen(false);
          }}>
            <Button ref={actionsButtonRef} type="button" variant="ghost" size="icon" aria-label="More recipe actions" aria-haspopup="menu" aria-expanded={actionsOpen} aria-controls="recipe-actions" onClick={() => setActionsOpen((open) => !open)}>
              <MoreHorizontal aria-hidden />
            </Button>
            {actionsOpen ? (
              <div id="recipe-actions" role="menu" aria-label="Recipe actions" className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                {onEdit ? <button ref={firstActionRef} type="button" role="menuitem" className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-foreground hover:bg-muted" onClick={() => { setActionsOpen(false); onEdit(); }}><Pencil className="size-4" aria-hidden />Edit</button> : null}
                {onDelete ? <button ref={!onEdit ? firstActionRef : undefined} type="button" role="menuitem" className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-destructive hover:bg-muted" onClick={() => { setActionsOpen(false); onDelete(); }}><Trash className="size-4" aria-hidden />Delete</button> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        {recipe.imageUrl ? (
          <div className="h-56 overflow-hidden bg-muted sm:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <header className="space-y-5 p-5 sm:p-8">
          <h1 className="break-words text-3xl font-semibold leading-tight sm:text-4xl">{recipe.title}</h1>
          {sourceHost || recipe.totalTime || recipe.servings ? (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
              {sourceHost ? (
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={"Original recipe at " + sourceHost} className="inline-flex min-w-0 items-center gap-1 underline decoration-border underline-offset-4 hover:text-foreground">
                  <span className="truncate">{sourceHost}</span><ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : null}
              {sourceHost && (recipe.totalTime || recipe.servings) ? <span aria-hidden>·</span> : null}
              {recipe.totalTime ? <span className="shrink-0">{recipe.totalTime}</span> : null}
              {recipe.totalTime && recipe.servings ? <span aria-hidden>·</span> : null}
              {recipe.servings ? <span className="shrink-0">{formatServingsLabel(recipe.servings)}</span> : null}
            </div>
          ) : null}
          {visibleSteps.length > 0 ? (
            <div className="space-y-2">
              <Button ref={startCookingRef} type="button" onClick={() => {
                onDismissFirstCookHint?.();
                trackAnalytics("cook_mode_started", { recipe_origin: "saved" });
                void requestAppFullscreen();
                setIsCooking(true);
              }}>Start cooking</Button>
              {showFirstCookHint ? (
                <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <p>Start cooking opens a clear, step-by-step view.</p>
                  <button type="button" className="min-h-11 font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-current" onClick={onDismissFirstCookHint}>Got it</button>
                </div>
              ) : null}
            </div>
          ) : null}
          {description ? <p className="max-w-[70ch] break-words whitespace-pre-wrap text-base leading-7 text-muted-foreground">{description}</p> : null}
        </header>

        <section className="border-t border-border p-5 sm:p-8">
          <h2 className="text-xl font-semibold">Ingredients</h2>
          {recipe.ingredients.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="break-words py-3 text-base leading-6">
                  {(ingredient.amount || ingredient.unit) ? <span className="font-semibold">{[ingredient.amount, ingredient.unit].filter(Boolean).join(" ")} </span> : null}
                  {ingredient.name}
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-muted-foreground">No ingredients added yet.</p>}
        </section>

        <section className="border-t border-border p-5 sm:p-8">
          <h2 className="text-xl font-semibold">Steps</h2>
          {visibleSteps.length > 0 ? (
            <ol className="mt-4 divide-y divide-border">
              {visibleSteps.map((step, index) => (
                <li key={step.id} className="flex gap-4 py-4 first:pt-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold" aria-hidden>{index + 1}</span>
                  <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-base leading-7">{step.text}</p>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 text-sm text-muted-foreground">No steps added yet. Cooking mode is unavailable.</p>}
        </section>
      </article>
    </section>
  );
}
