"use client";

import { useState } from "react";
import { A11y, EffectCards, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-cards";

import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "@/src/types/recipe";

type RecipeDeckProps = {
  recipes: Recipe[];
  favoriteRecipeIds: string[];
  onOpen: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
};

export function RecipeDeck({
  recipes,
  favoriteRecipeIds,
  onOpen,
  onToggleFavorite,
}: RecipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (recipes.length === 0) return null;

  const position = Math.min(activeIndex, recipes.length - 1);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Centred in whatever is left above the counter, and capped so a tall screen
          does not stretch the photo. h-full rather than flex-1: items-center stops
          the slide stretching, and Swiper needs a definite height or it collapses.

          The cards effect runs its container with overflow:visible so the stack is
          visible outside it, which is why main has to state overflow-x itself —
          otherwise the overflowing cards make the dashboard pan sideways. */}
      {/* pb-3 rather than a taller counter band: the band has to stay 3rem so its
          text keeps the add button's baseline, so the gap goes above it. */}
      <div className="flex min-h-0 flex-1 items-center pb-3">
        <Swiper
          modules={[EffectCards, Keyboard, A11y]}
          effect="cards"
          grabCursor
          keyboard={{ enabled: true }}
          cardsEffect={{ slideShadows: false, perSlideOffset: 9, perSlideRotate: 2 }}
          className="h-full max-h-[34rem] w-full"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
        {recipes.map((recipe) => (
          // Cards are stacked, so each slide needs an opaque backing: the card
          // itself is translucent and would otherwise reveal the one behind it.
          <SwiperSlide key={recipe.id} className="overflow-visible rounded-2xl bg-card">
            <RecipeCard
              recipe={recipe}
              onClick={() => onOpen(recipe)}
              isFavorite={favoriteRecipeIds.includes(recipe.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </SwiperSlide>
        ))}
        </Swiper>
      </div>

      {/* A 3rem band at the bottom of the content area, which is exactly the strip
          the floating add button occupies, so the two share a baseline. Left
          aligned and padded on the right so the button never covers the text. */}
      <p
        className="flex h-12 shrink-0 items-center pr-20 text-left text-xs text-muted-foreground"
        aria-live="polite"
      >
        {position + 1} / {recipes.length}
        {position < recipes.length - 1 ? " · swipe for the next recipe" : " · end of the list"}
      </p>
    </div>
  );
}
