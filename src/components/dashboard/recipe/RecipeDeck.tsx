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
      {/* Swiper's own container clips the deck, so a card being dragged never
          rides over the search field or the filter rail above it. */}
      <Swiper
        modules={[EffectCards, Keyboard, A11y]}
        effect="cards"
        grabCursor
        keyboard={{ enabled: true }}
        cardsEffect={{ slideShadows: false, perSlideOffset: 9, perSlideRotate: 2 }}
        className="min-h-0 w-full flex-1"
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

      {/* Left aligned so the floating add button never covers it. */}
      <p className="shrink-0 pt-2 pr-20 text-left text-xs text-muted-foreground" aria-live="polite">
        {position + 1} / {recipes.length}
        {position < recipes.length - 1 ? " · swipe for the next recipe" : " · end of the list"}
      </p>
    </div>
  );
}
