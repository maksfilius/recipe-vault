"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { getCenteredIndex, getSlideEmphasis } from "@/src/lib/carousel";
import type { Recipe } from "@/src/types/recipe";
import { RecipeCard } from "./RecipeCard";

type RecipeCarouselProps = {
  recipes: Recipe[];
  /** Changing it (the search query) scrolls back to the first card. */
  resetKey: string;
  onOpen: (recipe: Recipe) => void;
};

// Phone library: native scroll-snap gives the iOS momentum, so a hard flick passes several cards
// and still lands on one. Neighbours peek at the sides; each new centered card "clicks".
export function RecipeCarousel({ recipes, resetKey, onOpen }: RecipeCarouselProps) {
  const scrollerRef = useRef<HTMLOListElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const step = () => {
    const [first, second] = slideRefs.current;
    return first && second ? second.offsetLeft - first.offsetLeft : first?.offsetWidth ?? 0;
  };
  const scrollToIndex = (target: number) => {
    const clamped = Math.min(recipes.length - 1, Math.max(0, target));
    scrollerRef.current?.scrollTo({ left: clamped * step(), behavior: "smooth" });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const width = step();
      const next = getCenteredIndex(scroller.scrollLeft, width, recipes.length);
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
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

  // The scroll event this causes updates the counter.
  useEffect(() => { scrollerRef.current?.scrollTo({ left: 0 }); }, [resetKey]);

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    scrollToIndex(indexRef.current + (event.key === "ArrowRight" ? 1 : -1));
  };

  const current = Math.min(index, recipes.length - 1);
  return (
    <section aria-roledescription="carousel" aria-label="Recipes" className="-mx-4">
      <ol ref={scrollerRef} tabIndex={0} onKeyDown={onKeyDown} aria-label="Recipes, use arrow keys to browse"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[11vw] py-2 [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden">
        {recipes.map((recipe, slideIndex) => (
          <li key={recipe.id} ref={(node) => { slideRefs.current[slideIndex] = node; }}
              aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${recipes.length}`}
              className="w-[78vw] shrink-0 snap-center transition-[transform,opacity] duration-75 ease-out motion-reduce:transition-none">
              <RecipeCard recipe={recipe} photoClassName="aspect-[4/5]" onClick={() => (slideIndex === indexRef.current ? onOpen(recipe) : scrollToIndex(slideIndex))} />
            </li>
          ))}
      </ol>
      <p className="mt-3 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
        {current + 1} / {recipes.length}
      </p>
    </section>
  );
}
