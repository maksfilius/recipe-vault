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
    // Capped and centred: on a tall screen the card would otherwise grow and
    // stretch the photo. The bottom padding keeps the card clear of the floating
    // add button, which overlaps the lower part of this area.
    <div className="flex h-full min-h-0 flex-col justify-center pb-[4.5rem] md:pb-0">
      {/* The cards effect runs its container with overflow:visible so the stack is
          visible outside it, which is why main has to state overflow-x itself —
          otherwise the overflowing cards make the dashboard pan sideways. */}
      <Swiper
        modules={[EffectCards, Keyboard, A11y]}
        effect="cards"
        grabCursor
        keyboard={{ enabled: true }}
        cardsEffect={{ slideShadows: false, perSlideOffset: 9, perSlideRotate: 2 }}
        className="min-h-0 w-full flex-1 max-h-[34rem]"
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
