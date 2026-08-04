"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Link2, LoaderCircle, Sparkles, Utensils } from "lucide-react";

import heroBackground from "@/src/assets/Hero.png";
import { Button } from "@/src/components/ui/button";
import { PENDING_RECIPE_IMPORT_STORAGE_KEY } from "@/src/lib/pending-recipe-import";
import type { ImportedRecipe } from "@/src/types/recipe";

type ImportedRecipePreview = ImportedRecipe;

function formatSourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "recipe source";
  }
}

function pluralize(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function ImportPreviewSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/60 bg-background/62"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Building your recipe preview</span>
      <div className="grid sm:grid-cols-[9.5rem_minmax(0,1fr)]">
        <div className="h-28 animate-pulse bg-muted/75 motion-reduce:animate-none sm:h-full" />
        <div className="space-y-3 p-5">
          <div className="h-3 w-28 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="h-7 w-3/4 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted/80 motion-reduce:animate-none" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted/80 motion-reduce:animate-none" />
        </div>
      </div>
      <div className="h-16 animate-pulse border-t border-border/50 bg-muted/35 motion-reduce:animate-none" />
    </div>
  );
}

const Hero = () => {
  const scrollYRef = useRef(0);
  const bgRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const ticking = useRef(false);
  const [demoUrl, setDemoUrl] = useState("");
  const [importedRecipe, setImportedRecipe] = useState<ImportedRecipePreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const handleDemoImport = async () => {
    const normalizedUrl = demoUrl.trim();

    if (!normalizedUrl) {
      setImportError("Paste a recipe URL first.");
      setImportedRecipe(null);
      inputRef.current?.focus();
      return;
    }

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setIsImporting(true);
    setImportError("");
    setImportedRecipe(null);

    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | (ImportedRecipePreview & { error?: string })
        | null;

      if (!response.ok || !payload || payload.error) {
        setImportError(payload?.error ?? "We couldn’t import this recipe.");
        return;
      }

      setImportedRecipe(payload);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setImportError("We couldn’t import this recipe. Please try another link.");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setIsImporting(false);
      }
    }
  };

  const stashRecipeForDashboard = () => {
    if (!importedRecipe) return;

    try {
      window.sessionStorage.setItem(
        PENDING_RECIPE_IMPORT_STORAGE_KEY,
        JSON.stringify(importedRecipe),
      );
    } catch {
      // The dashboard remains available even when browser storage is disabled.
    }
  };

  useEffect(() => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

    if (isReducedMotion || isMobileViewport) return;

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const y = scrollYRef.current;
        if (bgRef.current) {
          bgRef.current.style.transform = `translate3d(0, ${y * 0.14}px, 0) scale(${1 + y * 0.00006})`;
        }
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(
    () => () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    },
    [],
  );

  const sourceHost = importedRecipe ? formatSourceHost(importedRecipe.sourceUrl) : "";
  const previewMeta = importedRecipe
    ? [
        importedRecipe.totalTime,
        importedRecipe.servings,
        pluralize(importedRecipe.ingredients.length, "ingredient"),
        pluralize(importedRecipe.steps.length, "step"),
      ].filter(Boolean)
    : [];

  return (
    <section className="relative isolate flex min-h-[92svh] items-center overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div
        className="absolute inset-0 -z-30 md:hidden"
        style={{
          backgroundImage: `linear-gradient(180deg,hsl(var(--background)/.91),hsl(var(--background)/.7) 48%,hsl(var(--background)) 100%),url(${heroBackground.src})`,
          backgroundPosition: "64% center",
          backgroundSize: "cover",
        }}
      />
      <div
        ref={bgRef}
        className="absolute inset-0 -z-30 hidden scale-[1.02] will-change-transform md:block"
        style={{
          backgroundImage: `linear-gradient(90deg,hsl(var(--background)/.95) 0%,hsl(var(--background)/.78) 42%,hsl(var(--background)/.53) 72%,hsl(var(--background)/.76) 100%),linear-gradient(180deg,hsl(var(--background)/.3),hsl(var(--background)) 100%),url(${heroBackground.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)_/_0.14),transparent_28%)]" />

      <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,.82fr)_minmax(520px,1.18fr)] lg:gap-16">
        <div className="mx-auto w-full min-w-0 max-w-xl text-center lg:mx-0 lg:text-left">
          <h1 className="animate-fade-in text-balance text-4xl font-bold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.55rem]">
            One link. A recipe you can actually use.
          </h1>

          <p className="animate-fade-in-delayed mx-auto mt-5 max-w-lg text-base leading-7 text-foreground/78 sm:text-lg sm:leading-8 lg:mx-0">
            Paste a recipe link and get a clean preview. Save the full recipe to your personal cookbook when you&apos;re ready.
          </p>

          <div className="animate-fade-in-more mt-7 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Button size="lg" className="w-full px-6 sm:w-auto" asChild>
              <Link href="/register">
                Create your cookbook
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="w-full bg-card/48 px-5 sm:w-auto" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-in-more relative mx-auto w-full min-w-0 max-w-2xl">
          <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/92 p-4 shadow-[0_28px_80px_hsl(var(--foreground)_/_0.14)] backdrop-blur-xl sm:p-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleDemoImport();
              }}
            >
              <label className="sr-only" htmlFor="hero-recipe-url">
                Recipe URL
              </label>
              <div className="flex flex-col gap-2 rounded-xl border border-border/75 bg-background/82 p-2 transition focus-within:border-primary/55 focus-within:ring-4 focus-within:ring-primary/10 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5">
                  <Link2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    id="hero-recipe-url"
                    className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                    value={demoUrl}
                    placeholder="Paste a recipe link"
                    onChange={(event) => {
                      setDemoUrl(event.target.value);
                      setImportError("");
                    }}
                    aria-invalid={Boolean(importError)}
                    aria-describedby={importError ? "hero-import-error" : undefined}
                    inputMode="url"
                    spellCheck={false}
                    autoComplete="url"
                  />
                </div>
                <Button
                  type="submit"
                  size="md"
                  disabled={isImporting}
                  className="h-11 rounded-lg px-5 sm:h-10"
                >
                  {isImporting ? (
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                  {isImporting ? "Importing…" : "Preview recipe"}
                </Button>
              </div>
            </form>

            {importError ? (
              <p
                id="hero-import-error"
                className="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300"
                role="alert"
              >
                {importError}
              </p>
            ) : null}

            <div className="mt-4" aria-busy={isImporting}>
              {isImporting ? (
                <ImportPreviewSkeleton />
              ) : importedRecipe ? (
                <article className="animate-card-in overflow-hidden rounded-2xl border border-border/60 bg-background/62">
                  <div className="grid sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                    <div className="relative h-28 overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.2),hsl(var(--muted)_/_0.72))] sm:h-full sm:min-h-44">
                      {importedRecipe.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={importedRecipe.imageUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Utensils className="absolute inset-0 m-auto h-10 w-10 text-foreground/18" aria-hidden="true" />
                      )}
                    </div>

                    <div className="min-w-0 p-4 sm:p-5">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                        {[importedRecipe.suggestedCollection, sourceHost].filter(Boolean).join(" · ")}
                      </p>
                      <h2 className="mt-1.5 line-clamp-2 text-xl font-bold leading-tight tracking-tight text-foreground">
                        {importedRecipe.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {importedRecipe.description}
                      </p>
                      <p className="mt-3 text-xs leading-5 text-foreground/68">
                        {previewMeta.join(" · ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border/55 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-muted-foreground">Full recipe and editing are available in your dashboard.</p>
                    <Button size="sm" className="shrink-0" asChild>
                      <Link href="/dashboard" onClick={stashRecipeForDashboard}>
                        Open full recipe
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ) : (
                <div className="grid min-h-60 place-items-center rounded-2xl border border-dashed border-border/65 bg-background/42 px-6 py-8 text-center">
                  <div>
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Link2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-foreground">Recipe preview</p>
                    <p className="mt-1 text-xs text-muted-foreground">Paste a link to see it here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
