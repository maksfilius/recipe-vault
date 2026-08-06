"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";

import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/src/types/recipe";

type RecipeDeckProps = {
  recipes: Recipe[];
  favoriteRecipeIds: string[];
  onOpen: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
};

// How far a drag has to travel before it commits to the next or previous card.
const COMMIT_DISTANCE = 90;
// A fast flick commits even when it is short.
const COMMIT_VELOCITY = 0.5;
// Movement below this is a tap, not a drag, so taps inside the card still work.
const TAP_SLOP = 8;
// Cards kept mounted behind the front one. Everything deeper is not rendered.
const VISIBLE_DEPTH = 3;

const STEP_OFFSET = 40;
const STEP_SCALE = 0.05;

function cardStyle(depth: number, dragY: number, isDragging: boolean): CSSProperties {
  const transition = isDragging
    ? "none"
    : "transform .38s cubic-bezier(.22,1,.36,1), opacity .38s cubic-bezier(.22,1,.36,1)";

  // Already dismissed: parked above the deck. While dragging back down it follows
  // the finger so returning to the previous recipe feels continuous.
  if (depth < 0) {
    const recovery = depth === -1 ? Math.max(0, dragY) : 0;
    return {
      transform: `translate3d(0, calc(-112% + ${recovery}px), 0) scale(.98)`,
      opacity: depth === -1 ? Math.min(1, recovery / COMMIT_DISTANCE) : 0,
      zIndex: 50,
      pointerEvents: "none",
      transition,
    };
  }

  // The front card tracks the finger directly; the ones behind it move up a
  // fraction of a step so the whole stack advances together.
  if (depth === 0) {
    const fade = Math.max(0, Math.min(1, (Math.abs(dragY) - COMMIT_DISTANCE * 0.6) / COMMIT_DISTANCE));
    return {
      transform: `translate3d(0, ${dragY}px, 0) scale(1)`,
      opacity: 1 - fade * 0.35,
      zIndex: 40,
      transition,
    };
  }

  const progress = dragY < 0 ? Math.min(1, -dragY / COMMIT_DISTANCE) : 0;
  const effectiveDepth = Math.max(0, depth - progress);

  return {
    transform: `translate3d(0, ${effectiveDepth * STEP_OFFSET}px, 0) scale(${1 - effectiveDepth * STEP_SCALE})`,
    opacity: Math.max(0, 1 - effectiveDepth * 0.12),
    zIndex: 40 - depth,
    pointerEvents: "none",
    transition,
  };
}

export function RecipeDeck({
  recipes,
  favoriteRecipeIds,
  onOpen,
  onToggleFavorite,
}: RecipeDeckProps) {
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gesture = useRef<{ id: number; startY: number; startTime: number } | null>(null);
  const didDrag = useRef(false);

  // Clamped on read rather than synced in an effect: filters can shrink the list
  // under the current position, and deriving avoids a second render pass.
  const lastIndex = Math.max(0, recipes.length - 1);
  const activeIndex = Math.min(requestedIndex, lastIndex);

  const goTo = useCallback(
    (nextIndex: number) => {
      setRequestedIndex(Math.max(0, Math.min(lastIndex, nextIndex)));
    },
    [lastIndex],
  );

  const endGesture = (clientY: number) => {
    const active = gesture.current;
    gesture.current = null;
    setIsDragging(false);

    if (!active) {
      setDragY(0);
      return;
    }

    const distance = clientY - active.startY;
    const elapsed = Math.max(1, performance.now() - active.startTime);
    const velocity = Math.abs(distance) / elapsed;
    const commits = Math.abs(distance) > COMMIT_DISTANCE || velocity > COMMIT_VELOCITY;

    setDragY(0);
    if (!commits) return;

    if (distance < 0) goTo(activeIndex + 1);
    else goTo(activeIndex - 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || recipes.length === 0) return;

    gesture.current = { id: event.pointerId, startY: event.clientY, startTime: performance.now() };
    didDrag.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;

    const distance = event.clientY - active.startY;
    if (!didDrag.current && Math.abs(distance) < TAP_SLOP) return;

    if (!didDrag.current) {
      didDrag.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    // Resist dragging past either end of the deck.
    const atStart = activeIndex === 0 && distance > 0;
    const atEnd = activeIndex >= recipes.length - 1 && distance < 0;
    setDragY(atStart || atEnd ? distance * 0.28 : distance);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.id !== event.pointerId) return;
    endGesture(event.clientY);
  };

  // A drag that ends on top of the card would otherwise fire a click and open
  // the recipe, so swallow that one click.
  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current) return;
    didDrag.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  };

  if (recipes.length === 0) return null;

  const from = Math.max(0, activeIndex - 1);
  const to = Math.min(recipes.length - 1, activeIndex + VISIBLE_DEPTH);
  const visible = recipes.slice(from, to + 1);

  return (
    // h-full, not flex-1: the host is a flex *item* with a definite height but it
    // is not a flex container, so flex-1 here would leave this at height:auto — and
    // since the cards are absolutely positioned, the deck would collapse to the
    // height of the counter line alone.
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative min-h-0 flex-1 touch-none select-none"
        style={{ perspective: "1200px" }}
        role="group"
        aria-roledescription="Recipe deck"
        aria-label={`Recipe ${activeIndex + 1} of ${recipes.length}`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
      >
        {visible.map((recipe, offset) => {
          const index = from + offset;
          const depth = index - activeIndex;

          return (
            // `inert` keeps the buried cards out of the tab order and out of the
            // accessibility tree, which plain aria-hidden would not do.
            // `bg-card` is the opaque backing the deck needs: the card itself is
            // translucent, which is fine over a page but lets the card underneath
            // show through when they are stacked. No overflow-hidden here — it would
            // clip the card's drop shadow, and that shadow is what separates the
            // layers of the stack.
            <div
              key={recipe.id}
              className="absolute inset-x-0 top-0 h-[calc(100%-3rem)] origin-top rounded-2xl bg-card will-change-transform"
              style={cardStyle(depth, dragY, isDragging)}
              inert={depth !== 0}
            >
              <RecipeCard
                recipe={recipe}
                onClick={() => onOpen(recipe)}
                isFavorite={favoriteRecipeIds.includes(recipe.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          );
        })}
      </div>

      <p className="shrink-0 pt-1 text-center text-xs text-muted-foreground" aria-live="polite">
        {activeIndex + 1} / {recipes.length}
        {activeIndex < recipes.length - 1 ? " · swipe up for the next recipe" : " · end of the list"}
      </p>
    </div>
  );
}
