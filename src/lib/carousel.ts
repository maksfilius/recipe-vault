// Pure math for the phone library carousel (src/components/dashboard/recipe/RecipeCarousel.tsx).

/** Index of the card nearest the center; `step` is one card's width plus the gap. */
export function getCenteredIndex(scrollLeft: number, step: number, count: number): number {
  if (count <= 0 || step <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}

/** How much a card stands out at `distance` cards from the center: full at 0, faded from 1 on. */
export function getSlideEmphasis(distance: number): { scale: number; opacity: number } {
  const t = Math.min(1, Math.abs(distance));
  return { scale: 1 - 0.08 * t, opacity: 1 - 0.45 * t };
}
