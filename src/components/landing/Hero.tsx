"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Link2, LoaderCircle, Utensils } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";
import { trackAnalytics } from "@/src/lib/analytics";
import { getImportSourceKind } from "@/src/lib/analytics-events";
import { SAMPLE_RECIPE_URL } from "@/src/lib/sample-recipe";
import type { ImportedRecipe } from "@/src/types/recipe";

// The preview shows the start of the recipe; "Show full recipe" reveals the rest.
const PREVIEW_INGREDIENTS = 6;
const PREVIEW_STEPS = 3;
const LONG_STEP = 240;

function ingredientLine({ amount, unit, name }: ImportedRecipe["ingredients"][number]) {
  return [amount, unit, name].map((part) => part?.trim()).filter(Boolean).join(" ");
}

function sourceHost(sourceUrl: string) {
  try { return new URL(sourceUrl).hostname.replace(/^www\./, ""); }
  catch { return "recipe source"; }
}

export default function Hero() {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState<ImportedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function previewRecipe(urlOverride?: string) {
    const submittedUrl = (urlOverride ?? url).trim();
    if (!submittedUrl) {
      setError("Paste a recipe link to start.");
      inputRef.current?.focus();
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    setRecipe(null);
    setExpanded(false);
    setImageFailed(false);
    trackAnalytics("url_import_started", { source_kind: getImportSourceKind(submittedUrl) });
    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: submittedUrl }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as (ImportedRecipe & { error?: string }) | null;
      if (!response.ok || !payload || payload.error) {
        trackAnalytics("import_failed", { source: "url", reason: "unknown" });
        setError(payload?.error ?? "We couldn’t read that recipe. Try another link.");
        return;
      }
      setRecipe(payload);
      trackAnalytics("import_preview_shown", { source_kind: getImportSourceKind(submittedUrl), has_ingredients: payload.ingredients.length > 0, has_steps: payload.steps.length > 0, has_image: Boolean(payload.imageUrl) });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      trackAnalytics("import_failed", { source: "url", reason: "network" });
      setError("We couldn’t reach that recipe. Check the link and try again.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }

  function tryExample() {
    setUrl(SAMPLE_RECIPE_URL);
    void previewRecipe(SAMPLE_RECIPE_URL);
  }

  function keepDraft() {
    if (!recipe) return;
    for (const draft of [recipe, { ...recipe, imageUrl: undefined }]) {
      try {
        window.sessionStorage.setItem(PENDING_RECIPE_IMPORT_STORAGE_KEY, JSON.stringify(draft));
        return;
      } catch {
        // A large inline image may exceed session storage. Retry without it.
      }
    }
  }

  const missing = recipe ? [
    recipe.ingredients.length === 0 ? "ingredients" : null,
    recipe.steps.length === 0 ? "steps" : null,
  ].filter(Boolean) : [];
  const ingredients = recipe?.ingredients.map(ingredientLine).filter(Boolean) ?? [];
  const steps = recipe?.steps.map((step) => step.text.trim()).filter(Boolean) ?? [];
  const canExpand = ingredients.length > PREVIEW_INGREDIENTS || steps.length > PREVIEW_STEPS
    || steps.slice(0, PREVIEW_STEPS).some((step) => step.length > LONG_STEP);
  const shownIngredients = expanded ? ingredients : ingredients.slice(0, PREVIEW_INGREDIENTS);
  const shownSteps = expanded ? steps : steps.slice(0, PREVIEW_STEPS);
  const meta = recipe ? [recipe.totalTime, recipe.servings].map((part) => part?.trim()).filter(Boolean) : [];

  return (
    <section id="hero" className="scroll-mt-20 border-b border-border bg-background px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <h1 className="font-display text-balance text-[clamp(3.25rem,6vw,5.5rem)] leading-[1.04] tracking-[-0.035em] text-foreground">
            Save recipes. Cook without distractions.
          </h1>
          <p className="mt-7 max-w-[34rem] text-lg leading-8 text-muted-foreground sm:text-xl">
            Turn any recipe page into clear ingredients and steps, cook from it one step at a time, and keep the ones you love in a free personal cookbook.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#try-it" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
              Try a recipe link <ArrowRight aria-hidden="true" size={18} />
            </a>
            <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-foreground underline-offset-4 hover:underline">Create your free cookbook</Link>
          </div>
        </div>
        <div id="try-it" className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4 sm:px-7">
            <p className="font-display text-2xl text-foreground">See the recipe, first.</p>
            <p className="mt-1 text-sm text-muted-foreground">No account needed to preview.</p>
          </div>
          <div className="p-5 sm:p-7">
            <form onSubmit={(event) => { event.preventDefault(); void previewRecipe(); }}>
              <label htmlFor="hero-recipe-url" className="mb-2 block text-sm font-semibold text-foreground">Recipe link</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <Link2 aria-hidden="true" size={18} className="shrink-0 text-muted-foreground" />
                  <input ref={inputRef} id="hero-recipe-url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }}
                    placeholder="https://example.com/recipe" className="h-12 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                    inputMode="url" autoComplete="url" spellCheck={false} aria-invalid={Boolean(error)}
                    aria-describedby={error ? "hero-import-error" : undefined} />
                </div>
                <Button type="submit" disabled={loading} className="min-h-12 shrink-0">
                  {loading ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <ArrowRight aria-hidden="true" />}
                  {loading ? "Reading…" : "Preview recipe"}
                </Button>
              </div>
              {error && <p id="hero-import-error" role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
              <p className="mt-3 text-sm text-muted-foreground">
                No link handy?{" "}
                <button type="button" onClick={tryExample} disabled={loading}
                  className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground">
                  Try an example
                </button>
              </p>
            </form>
            <div className="mt-6 min-h-56" aria-busy={loading}>
              {loading ? (
                <div role="status" className="space-y-4 border-t border-border pt-6">
                  <span className="sr-only">Reading recipe</span>
                  <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
                </div>
              ) : recipe ? (
                <article id="hero-recipe-preview" aria-labelledby="hero-recipe-title" className="min-w-0 border-t border-border pt-6">
                  {recipe.imageUrl && !imageFailed && (
                    // eslint-disable-next-line @next/next/no-img-element -- a data: preview or an external https photo
                    <img src={recipe.imageUrl} alt="" onError={() => setImageFailed(true)} referrerPolicy="no-referrer"
                      className="mb-5 aspect-[16/9] w-full rounded-xl border border-border bg-muted object-cover" />
                  )}
                  <h2 id="hero-recipe-title" className="font-display text-3xl leading-tight text-foreground [overflow-wrap:anywhere]">{recipe.title}</h2>
                  {meta.length > 0 && <p className="mt-2 text-sm font-medium text-foreground">{meta.join(" · ")}</p>}
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-11 max-w-full items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    <span className="truncate">Original on {sourceHost(recipe.sourceUrl)}</span>
                    <ExternalLink aria-hidden="true" size={15} className="shrink-0" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  {missing.length > 0 && <p className="mt-3 text-sm text-muted-foreground">We couldn’t find {missing.join(" or ")}. You can add them before saving.</p>}

                  {ingredients.length > 0 && (
                    <section aria-labelledby="hero-ingredients" className="mt-6">
                      <h3 id="hero-ingredients" className="flex items-baseline justify-between gap-3 pb-2 text-sm font-semibold text-foreground">
                        Ingredients <span className="font-normal text-muted-foreground">{ingredients.length}</span>
                      </h3>
                      <ul className="text-sm leading-6 text-foreground">
                        {shownIngredients.map((line, index) => (
                          <li key={`${index}-${line}`} className="py-1.5 [overflow-wrap:anywhere]">{line}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {steps.length > 0 && (
                    <section aria-labelledby="hero-steps" className="mt-6">
                      <h3 id="hero-steps" className="flex items-baseline justify-between gap-3 pb-2 text-sm font-semibold text-foreground">
                        Steps <span className="font-normal text-muted-foreground">{steps.length}</span>
                      </h3>
                      <ol className="text-sm leading-6 text-foreground">
                        {shownSteps.map((text, index) => (
                          <li key={`${index}-${text.slice(0, 24)}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 py-2">
                            <span aria-hidden="true" className="font-semibold text-primary">{index + 1}</span>
                            <p className={expanded ? "[overflow-wrap:anywhere]" : "line-clamp-4 [overflow-wrap:anywhere]"}>{text}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {canExpand && (
                    <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="hero-recipe-preview"
                      className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
                      {expanded ? "Show less" : `Show full recipe (${ingredients.length} ingredients, ${steps.length} steps)`}
                    </button>
                  )}

                  <div className="mt-6">
                    <Button asChild size="lg" className="w-full sm:w-auto"><Link href="/dashboard" onClick={keepDraft}>Save to my free cookbook <ArrowRight aria-hidden="true" /></Link></Button>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">Sign in or create a free account, then review the recipe before it’s saved.</p>
                  </div>
                </article>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 text-center">
                  <Utensils aria-hidden="true" className="text-primary" size={28} strokeWidth={1.5} />
                  <p className="mt-4 font-display text-xl text-foreground">Your recipe will appear here</p>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">Paste a link from a recipe website to see what we can extract.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
