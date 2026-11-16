"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, ListChecks, Timer, X } from "lucide-react";

import { Button } from "../../ui/button";
import { paginateStepText, remapPageIndex } from "@/src/lib/cooking-step-pages";
import { exitAppFullscreen } from "@/src/lib/fullscreen";
import { findStepDurations, formatCountdown } from "@/src/lib/step-durations";
import type { Recipe } from "@/src/types/recipe";
import { trackAnalytics } from "@/src/lib/analytics";
import { getStepCountBucket } from "@/src/lib/analytics-events";

type CookingModeProps = { recipe: Recipe; onExit: () => void };
type RunningTimer = { id: string; label: string; endsAt: number; stepIndex: number };
type WakeLockSentinelLike = { released: boolean; release: () => Promise<void> };

function useScreenWakeLock() {
  useEffect(() => {
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let pending = false;
    let closed = false;

    const release = () => {
      const old = sentinel;
      sentinel = null;
      void old?.release().catch(() => undefined);
    };
    const acquire = async () => {
      if (closed || pending || document.visibilityState !== "visible" || (sentinel && !sentinel.released)) return;
      pending = true;
      try {
        const lock = await wakeLock.request("screen");
        if (closed || document.visibilityState !== "visible") void lock.release().catch(() => undefined);
        else sentinel = lock;
      } catch {
        // Denied or unsupported: cooking stays usable.
      } finally {
        pending = false;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
      else release();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      closed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, []);
}

function useAlarmSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const prime = useCallback(() => {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    contextRef.current ??= new AudioContextClass();
    void contextRef.current.resume().catch(() => undefined);
  }, []);
  const play = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);
    [0, 0.32].forEach((offset) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.22);
    });
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
  }, []);
  useEffect(() => () => { void contextRef.current?.close().catch(() => undefined); }, []);
  return { prime, play };
}

function formatIngredient(ingredient: Recipe["ingredients"][number]) {
  return [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}

const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function CookingMode({ recipe, onExit }: CookingModeProps) {
  const steps = recipe.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [partIndex, setPartIndex] = useState(0);
  const [pages, setPages] = useState<string[]>(() => steps[0]?.text ? [steps[0].text] : []);
  const pagesRef = useRef(pages);
  const partIndexRef = useRef(partIndex);
  const paginatedStepRef = useRef(0);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const alreadyRung = useRef(new Set<string>());
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const ingredientButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const openedDrawer = useRef(false);
  const { prime, play } = useAlarmSound();
  const currentStep = steps[stepIndex];
  const suggestions = useMemo(() => findStepDurations(currentStep?.text ?? ""), [currentStep?.text]);
  const safePartIndex = Math.min(partIndex, Math.max(0, pages.length - 1));
  const lastStepIndex = steps.length - 1;

  useScreenWakeLock();

  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { partIndexRef.current = partIndex; }, [partIndex]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      void exitAppFullscreen();
    };
  }, []);

  useEffect(() => {
    if (isIngredientsOpen) {
      openedDrawer.current = true;
      drawerCloseRef.current?.focus();
    } else if (openedDrawer.current) {
      ingredientButtonRef.current?.focus();
    }
  }, [isIngredientsOpen]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const measure = measureRef.current;
    if (!stage || !measure || !currentStep) return;
    const paginate = () => {
      if (stage.clientHeight < 40 || stage.clientWidth < 40) return;
      const style = getComputedStyle(stage);
      const availableHeight = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const nextPages = paginateStepText(currentStep.text, (candidate) => {
        measure.textContent = candidate;
        return measure.scrollHeight <= availableHeight - 4;
      });
      const safePages = nextPages.length ? nextPages : [currentStep.text];
      const nextPartIndex = paginatedStepRef.current === stepIndex
        ? remapPageIndex(pagesRef.current, partIndexRef.current, safePages)
        : partIndexRef.current === Number.MAX_SAFE_INTEGER ? safePages.length - 1 : 0;
      paginatedStepRef.current = stepIndex;
      pagesRef.current = safePages;
      partIndexRef.current = nextPartIndex;
      setPages((previous) => previous.length === safePages.length && previous.every((page, index) => page === safePages[index]) ? previous : safePages);
      setPartIndex(nextPartIndex);
    };
    const observer = new ResizeObserver(paginate);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [currentStep, stepIndex]);

  useEffect(() => {
    if (timers.length === 0) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timers.length]);

  useEffect(() => {
    if (document.visibilityState !== "visible") return;
    const due = timers.filter((timer) => timer.endsAt <= now && !alreadyRung.current.has(timer.id));
    if (!due.length) return;
    due.forEach((timer) => alreadyRung.current.add(timer.id));
    play();
    navigator.vibrate?.([200, 100, 200]);
  }, [now, timers, play]);

  const goPrevious = useCallback(() => {
    if (partIndex > 0) setPartIndex((part) => part - 1);
    else if (stepIndex > 0) {
      setStepIndex((step) => step - 1);
      setPartIndex(Number.MAX_SAFE_INTEGER);
    }
  }, [partIndex, stepIndex]);

  const goNext = useCallback(() => {
    if (partIndex < pages.length - 1) setPartIndex((part) => part + 1);
    else if (stepIndex < lastStepIndex) {
      setStepIndex((step) => step + 1);
      setPartIndex(0);
    } else {
      trackAnalytics("cook_mode_completed", { recipe_origin: "saved", step_count_bucket: getStepCountBucket(steps.length) });
      onExit();
    }
  }, [partIndex, pages.length, stepIndex, lastStepIndex, onExit, steps.length]);

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (isIngredientsOpen) setIsIngredientsOpen(false);
      else onExit();
      return;
    }
    if (event.key === "Tab") {
      const scope = isIngredientsOpen ? drawerRef.current : dialogRef.current;
      const focusable = Array.from(scope?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (isIngredientsOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      (event.key === "ArrowLeft" ? goPrevious : goNext)();
    }
  }

  function startTimer(seconds: number, label: string) {
    prime();
    setNow(() => Date.now());
    setTimers((current) => [...current, {
      id: crypto.randomUUID(),
      label,
      endsAt: Date.now() + seconds * 1_000,
      stepIndex,
    }]);
  }

  function dismissTimer(id: string) {
    alreadyRung.current.delete(id);
    setTimers((current) => current.filter((timer) => timer.id !== id));
  }

  function toggleIngredient(id: string) {
    setCheckedIngredients((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  if (!currentStep || typeof document === "undefined") return null;

  const isLastPart = safePartIndex === pages.length - 1;
  const isLastStep = stepIndex === lastStepIndex;
  const progress = ((stepIndex + (safePartIndex + 1) / Math.max(1, pages.length)) / steps.length) * 100;
  const nextLabel = !isLastPart ? "Continue step" : isLastStep ? "Finish cooking" : "Next step";

  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cook-title"
      onKeyDown={onDialogKeyDown}
      className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <h2 id="cook-title" className="min-w-0 flex-1 truncate font-display text-lg sm:text-xl">{recipe.title}</h2>
          {recipe.ingredients.length > 0 && (
            <Button ref={ingredientButtonRef} type="button" variant="ghost" size="sm" aria-expanded={isIngredientsOpen}
              aria-controls="cook-ingredients"
              aria-label={"Ingredients, " + checkedIngredients.length + " of " + recipe.ingredients.length + " checked"}
              onClick={() => setIsIngredientsOpen(true)}>
              <ListChecks aria-hidden="true" /><span className="hidden sm:inline">Ingredients</span>
              <span className="text-xs tabular-nums">{checkedIngredients.length}/{recipe.ingredients.length}</span>
            </Button>
          )}
          <Button ref={closeRef} type="button" variant="ghost" size="sm" aria-label="Exit cooking mode" onClick={onExit}>
            <X aria-hidden="true" /><span className="hidden sm:inline">Close</span>
          </Button>
        </div>
        {timers.length > 0 && (
          <div className="border-t border-border px-4 py-2 sm:px-8" aria-label="Cooking timers">
            <ul className="mx-auto flex max-w-5xl gap-2 overflow-x-auto">
              {timers.map((timer) => {
                const remaining = (timer.endsAt - now) / 1_000;
                const done = remaining <= 0;
                return (
                  <li key={timer.id} className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2 py-1">
                    <Timer aria-hidden="true" className="size-4 text-primary" />
                    <span className="font-mono text-sm font-semibold tabular-nums">{done ? "Done" : formatCountdown(remaining)}</span>
                    <span className="max-w-24 truncate text-xs text-muted-foreground">{timer.label} · step {timer.stepIndex + 1}</span>
                    <Button type="button" variant="ghost" size="xs" className="min-h-8 h-8 w-8 p-0" aria-label={"Dismiss " + timer.label + " timer"} onClick={() => dismissTimer(timer.id)}><X aria-hidden="true" /></Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      <main className="min-h-0 flex-1">
        <div className="mx-auto flex h-full max-w-5xl flex-col px-5 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-8">
          <p className="shrink-0 text-sm font-semibold text-primary">Step {stepIndex + 1} of {steps.length}{pages.length > 1 ? " · Part " + (safePartIndex + 1) + " of " + pages.length : ""}</p>
          <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center overflow-hidden py-4">
            <p aria-live="polite" className="w-full max-w-[65ch] break-words whitespace-pre-wrap text-[clamp(1.5rem,3vw,2.75rem)] leading-[1.35] text-foreground">
              {pages[safePartIndex] ?? currentStep.text}
            </p>
            <p ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 w-full max-w-[65ch] break-words whitespace-pre-wrap text-[clamp(1.5rem,3vw,2.75rem)] leading-[1.35]" />
          </div>
          {suggestions.length > 0 && (
            <div className="shrink-0 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground">Start a timer from this step</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button key={suggestion.seconds} type="button" variant="secondary" size="sm" onClick={() => startTimer(suggestion.seconds, suggestion.label)}>
                    <Timer aria-hidden="true" />{suggestion.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-card px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 h-1 rounded-full bg-muted" role="progressbar" aria-label="Cooking progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: String(progress) + "%" }} />
          </div>
          <nav aria-label="Cooking steps" className="flex gap-3">
            <Button type="button" variant="secondary" className="h-12 flex-1" disabled={stepIndex === 0 && safePartIndex === 0} onClick={goPrevious}>
              <ChevronLeft aria-hidden="true" />Previous
            </Button>
            <Button type="button" className="h-12 flex-[1.4]" onClick={goNext}>
              {nextLabel}{isLastPart && isLastStep ? <Check aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
            </Button>
          </nav>
        </div>
      </footer>

      {isIngredientsOpen && (
        <>
          <button type="button" tabIndex={-1} className="absolute inset-0 z-10 bg-foreground/30" aria-label="Close ingredients" onClick={() => setIsIngredientsOpen(false)} />
          <aside ref={drawerRef} id="cook-ingredients" aria-label="Ingredients" className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div><h3 className="font-display text-2xl">Ingredients</h3><p className="mt-1 text-sm text-muted-foreground">{checkedIngredients.length} of {recipe.ingredients.length} checked</p></div>
              <Button ref={drawerCloseRef} type="button" variant="ghost" size="icon" aria-label="Back to step" onClick={() => setIsIngredientsOpen(false)}><X aria-hidden="true" /></Button>
            </div>
            {timers.length > 0 && (
              <div className="border-b border-border px-5 py-3">
                <p className="text-xs font-semibold text-muted-foreground">Running timers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {timers.map((timer) => (
                    <span key={timer.id} className="flex flex-col rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-xs text-muted-foreground">{timer.label} · step {timer.stepIndex + 1}</span>
                      <span className="font-mono text-sm font-semibold tabular-nums">{timer.endsAt <= now ? "Done" : formatCountdown((timer.endsAt - now) / 1_000)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <ul className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
              {recipe.ingredients.map((ingredient) => {
                const checked = checkedIngredients.includes(ingredient.id);
                return (
                  <li key={ingredient.id} className="border-b border-border">
                    <label className="flex min-h-14 cursor-pointer items-center gap-3 py-3 text-base">
                      <input type="checkbox" checked={checked} onChange={() => toggleIngredient(ingredient.id)} className="size-5 shrink-0 accent-primary" />
                      <span className={checked ? "text-muted-foreground line-through" : "text-foreground"}>{formatIngredient(ingredient)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </div>,
    document.body,
  );
}
