"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Timer, X } from "lucide-react";

import { Button } from "../../ui/button";
import { exitAppFullscreen } from "@/src/lib/fullscreen";
import { findStepDurations, formatCountdown } from "@/src/lib/step-durations";
import type { Recipe } from "@/src/types/recipe";

type CookingModeProps = {
  recipe: Recipe;
  onExit: () => void;
};

type RunningTimer = {
  id: string;
  label: string;
  /** Absolute deadline. Never a decremented counter — see docs/pwa-v1.md. */
  endsAt: number;
  totalMs: number;
  stepIndex: number;
};

type WakeLockSentinelLike = { released: boolean; release: () => Promise<void> };

function formatIngredient(ingredient: Recipe["ingredients"][number]) {
  return [ingredient.amount, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}

/**
 * Keeps the screen awake while cooking. The lock is dropped by the browser
 * whenever the page is hidden, so it has to be re-acquired on every return.
 */
function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return;

      try {
        sentinel = await wakeLock.request("screen");
      } catch {
        // Denied or unsupported: cooking mode still works, the screen just dims.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}

/** Short beep for a finished timer. Primed by the tap that started it. */
function useAlarmSound() {
  const contextRef = useRef<AudioContext | null>(null);

  const prime = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

    // Two short pulses read as an alarm rather than a UI blip.
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

  useEffect(() => () => void contextRef.current?.close().catch(() => undefined), []);

  return { prime, play };
}

export function CookingMode({ recipe, onExit }: CookingModeProps) {
  const steps = recipe.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const alreadyRung = useRef<Set<string>>(new Set());
  const { prime, play } = useAlarmSound();

  const lastIndex = Math.max(0, steps.length - 1);
  const currentStep = steps[Math.min(stepIndex, lastIndex)];
  const suggestions = useMemo(() => findStepDurations(currentStep?.text ?? ""), [currentStep?.text]);

  useScreenWakeLock(true);

  // One interval only drives re-renders; every displayed value is derived from
  // the absolute deadline, so a throttled or frozen tab cannot skew a timer.
  useEffect(() => {
    if (timers.length === 0) return;

    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timers.length]);

  // Fire the alarm once per timer. Tracked in a ref rather than state: "has this
  // already rung" is bookkeeping, and writing it back into state here would make
  // the effect re-render on every tick.
  useEffect(() => {
    const due = timers.filter(
      (timer) => timer.endsAt <= now && !alreadyRung.current.has(timer.id),
    );
    if (due.length === 0) return;

    due.forEach((timer) => alreadyRung.current.add(timer.id));
    play();
    navigator.vibrate?.([200, 100, 200]);
  }, [now, timers, play]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      // Fullscreen is requested by whoever opened cooking mode, but releasing it
      // belongs here so every exit path — button, Escape, unmount — undoes it.
      void exitAppFullscreen();
    };
  }, []);

  const goTo = useCallback(
    (nextIndex: number) => setStepIndex(Math.max(0, Math.min(lastIndex, nextIndex))),
    [lastIndex],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
      else if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setStepIndex((current) => Math.min(lastIndex, current + 1));
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setStepIndex((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lastIndex, onExit]);

  const startTimer = (seconds: number, label: string) => {
    prime();
    // The deadline is read inside the updater: the interval effect starts as soon
    // as the first timer exists and refreshes `now` from there.
    setTimers((current) => [
      ...current,
      {
        id: globalThis.crypto.randomUUID(),
        label,
        endsAt: Date.now() + seconds * 1_000,
        totalMs: seconds * 1_000,
        stepIndex,
      },
    ]);
  };

  const dismissTimer = (id: string) => {
    alreadyRung.current.delete(id);
    setTimers((current) => current.filter((timer) => timer.id !== id));
  };

  const toggleIngredient = (id: string) =>
    setCheckedIngredients((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  if (!currentStep || typeof document === "undefined") return null;

  const progress = ((stepIndex + 1) / steps.length) * 100;
  const isLastStep = stepIndex === lastIndex;

  // Rendered into <body>. The dashboard's content column carries backdrop-blur,
  // and a backdrop-filter makes an element the containing block for fixed-position
  // descendants — so in place this overlay would start after the sidebar instead of
  // covering the whole viewport. The portal is also why the sidebar needs no
  // special handling: nothing of the shell stays visible.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={`Cooking ${recipe.title}`}
    >
      <header className="shrink-0 border-b border-border/60 bg-card/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
            Cooking
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{recipe.title}</p>
          <Button variant="ghost" size="sm" aria-label="Exit cooking mode" onClick={onExit}>
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
        <div className="h-1 w-full bg-foreground/10" role="presentation">
          <div
            className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
          <section aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
            {/* Deliberately large: this is read from arm's length with messy hands. */}
            <p className="mt-3 text-xl leading-8 text-foreground sm:text-2xl sm:leading-9">
              {currentStep.text}
            </p>

            {suggestions.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timers in this step
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.seconds}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-border/60"
                      onClick={() => startTimer(suggestion.seconds, suggestion.label)}
                    >
                      <Timer className="h-4 w-4" />
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {timers.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {timers.map((timer) => {
                  const remaining = (timer.endsAt - now) / 1_000;
                  const isDone = remaining <= 0;

                  const elapsed = Math.min(1, 1 - (timer.endsAt - now) / timer.totalMs);

                  return (
                    <li
                      key={timer.id}
                      className={[
                        "overflow-hidden rounded-xl border",
                        isDone ? "border-primary bg-primary/10" : "border-border/60 bg-card/70",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Timer className={isDone ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
                        <span className="font-mono text-lg tabular-nums">
                          {isDone ? "done" : formatCountdown(remaining)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {timer.label} · step {timer.stepIndex + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          aria-label="Dismiss timer"
                          onClick={() => dismissTimer(timer.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="h-1 w-full bg-foreground/10">
                        <div
                          className="h-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                          style={{ width: `${Math.max(0, elapsed) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          {recipe.ingredients.length > 0 ? (
            <section className="lg:sticky lg:top-0">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm font-semibold lg:pointer-events-none lg:border-0 lg:bg-transparent lg:px-0"
                aria-expanded={isIngredientsOpen}
                onClick={() => setIsIngredientsOpen((open) => !open)}
              >
                <span className="inline-flex items-center gap-2">
                  Ingredients
                  <span className="text-xs font-normal text-muted-foreground">
                    {checkedIngredients.length}/{recipe.ingredients.length}
                  </span>
                </span>
                <ChevronRight
                  className={[
                    "h-4 w-4 transition-transform lg:hidden",
                    isIngredientsOpen ? "rotate-90" : "",
                  ].join(" ")}
                />
              </button>

              <ul className={[isIngredientsOpen ? "mt-2 block" : "hidden", "lg:mt-3 lg:block"].join(" ")}>
                {recipe.ingredients.map((ingredient) => {
                  const isChecked = checkedIngredients.includes(ingredient.id);

                  return (
                    <li key={ingredient.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-sm"
                        aria-pressed={isChecked}
                        onClick={() => toggleIngredient(ingredient.id)}
                      >
                        <span
                          className={[
                            "grid h-5 w-5 shrink-0 place-items-center rounded border",
                            isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                          ].join(" ")}
                        >
                          {isChecked ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className={isChecked ? "text-muted-foreground line-through" : "text-foreground"}>
                          {formatIngredient(ingredient)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </main>

      {/* Large targets, and padded for the home indicator so the primary action is
          never under the gesture bar. */}
      <footer className="shrink-0 border-t border-border/60 bg-card/70 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            className="h-12 flex-1 border border-border/60"
            disabled={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
          <Button
            type="button"
            className="h-12 flex-[1.6]"
            onClick={() => (isLastStep ? onExit() : goTo(stepIndex + 1))}
          >
            {isLastStep ? "Finish" : "Next step"}
            {isLastStep ? <Check className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
      </footer>
    </div>,
    document.body,
  );
}
