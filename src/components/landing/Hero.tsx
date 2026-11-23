"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Link2, LoaderCircle, Utensils } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";
import { trackAnalytics } from "@/src/lib/analytics";
import { getImportSourceKind } from "@/src/lib/analytics-events";
import type { ImportedRecipe } from "@/src/types/recipe";

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

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function previewRecipe() {
    const submittedUrl = url.trim();
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
            </form>
            <div className="mt-6 min-h-56" aria-busy={loading}>
              {loading ? (
                <div role="status" className="space-y-4 border-t border-border pt-6">
                  <span className="sr-only">Reading recipe</span>
                  <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
                </div>
              ) : recipe ? (
                <article className="border-t border-border pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Preview · {sourceHost(recipe.sourceUrl)}</p>
                  <h2 className="mt-2 font-display text-3xl leading-tight text-foreground">{recipe.title}</h2>
                  {recipe.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{recipe.description}</p>}
                  <p className="mt-4 text-sm text-foreground">{[
                    recipe.totalTime, recipe.servings,
                    `${recipe.ingredients.length} ingredients`, `${recipe.steps.length} steps`,
                  ].filter(Boolean).join(" · ")}</p>
                  {missing.length > 0 && <p className="mt-3 text-sm text-muted-foreground">We couldn’t find {missing.join(" or ")}. Review the draft before saving.</p>}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Review the full draft before saving.</p>
                    <Button asChild size="sm"><Link href="/dashboard" onClick={keepDraft}>Open recipe <ArrowRight aria-hidden="true" /></Link></Button>
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
