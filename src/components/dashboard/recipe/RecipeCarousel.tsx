"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { getCenteredIndex, getSlideEmphasis } from "@/src/lib/carousel";
import type { Recipe } from "@/src/types/recipe";
import { RecipeCard } from "./RecipeCard";

type RecipeCarouselProps = {
  recipes: Recipe[];
  /** Changing it (the search query) scrolls back to the first card. */
  resetKey: string;
  /** Card to show on mount, so returning from an opened recipe keeps the place. */
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onOpen: (recipe: Recipe) => void;
};

// Phone library: native scroll-snap gives the iOS momentum, so a hard flick passes several cards
// and still lands on one. Neighbours peek at the sides; each new centered card "clicks".
export function RecipeCarousel({ recipes, resetKey, initialIndex = 0, onIndexChange, onOpen }: RecipeCarouselProps) {
  const scrollerRef = useRef<HTMLOListElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  const startIndex = Math.min(Math.max(0, recipes.length - 1), Math.max(0, initialIndex));
  const indexRef = useRef(startIndex);
  const [index, setIndex] = useState(startIndex);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => { onIndexChangeRef.current = onIndexChange; });

  const step = () => {
    const [first, second] = slideRefs.current;
    return first && second ? second.offsetLeft - first.offsetLeft : first?.offsetWidth ?? 0;
  };
  const scrollToIndex = (target: number) => {
    const clamped = Math.min(recipes.length - 1, Math.max(0, target));
    scrollerRef.current?.scrollTo({ left: clamped * step(), behavior: "smooth" });
    return clamped;
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Restore the place instantly (no smooth scroll, no vibration) before listening.
    if (indexRef.current > 0 && Math.abs(scroller.scrollLeft - indexRef.current * step()) > 1) scroller.scrollLeft = indexRef.current * step();
    let frame = 0;
    const update = () => {
      frame = 0;
      const width = step();
      const next = getCenteredIndex(scroller.scrollLeft, width, recipes.length);
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
        onIndexChangeRef.current?.(next);
        navigator.vibrate?.(8);
      }
      if (reduceMotion || width <= 0) return;
      slideRefs.current.forEach((slide, slideIndex) => {
        if (!slide) return;
        const { scale, opacity } = getSlideEmphasis(slideIndex - scroller.scrollLeft / width);
        slide.style.transform = `scale(${scale})`;
        slide.style.opacity = String(opacity);
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [recipes.length]);

  // A new search starts at the first card; the scroll event this causes updates the counter.
  const lastResetKey = useRef(resetKey);
  useEffect(() => {
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [resetKey]);

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    // Roving focus: only the centered card is in the tab order, and focus moves with it.
    const target = scrollToIndex(indexRef.current + (event.key === "ArrowRight" ? 1 : -1));
    slideRefs.current[target]?.querySelector("button")?.focus({ preventScroll: true });
  };
  // A keyboard click (detail 0) opens the focused card; a tap on a peeking neighbour scrolls to it.
  const onCardClick = (slideIndex: number, recipe: Recipe) => (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0 || slideIndex === indexRef.current) onOpen(recipe);
    else scrollToIndex(slideIndex);
  };

  const current = Math.min(index, recipes.length - 1);
  return (
    <section aria-roledescription="carousel" aria-label="Recipes" className="-mx-4">
      <ol ref={scrollerRef} onKeyDown={onKeyDown} aria-label="Recipes, use arrow keys to browse"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[11vw] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recipes.map((recipe, slideIndex) => (
          <li key={recipe.id} ref={(node) => { slideRefs.current[slideIndex] = node; }}
              aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${recipes.length}`}
              className="w-[78vw] shrink-0 snap-center transition-[transform,opacity] duration-75 ease-out motion-reduce:transition-none">
              <RecipeCard recipe={recipe} photoClassName="aspect-[4/5]" tabIndex={slideIndex === index ? 0 : -1} onClick={onCardClick(slideIndex, recipe)} />
            </li>
          ))}
      </ol>
      <p className="mt-3 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {current + 1} / {recipes.length}
      </p>
    </section>
  );
}
