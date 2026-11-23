import { cn } from "@/src/lib/utils";

// Real Keep & Cook screens captured with the demo cookbook (scripts/store/capture-screens.mjs).
export const screens = {
  extensionPanel: { src: "/screens/extension-panel.webp", width: 800, height: 2080, alt: "The Keep & Cook side panel showing a roast chicken recipe: photo, time and servings, Save to my recipes and Start cooking buttons, and an ingredient checklist with two items ticked." },
  extensionCooking: { src: "/screens/extension-cooking.webp", width: 2400, height: 1400, alt: "Cooking mode from the extension: step 3 of 4 in large text, a one-hour timer running, and Previous and Next step buttons." },
  libraryDesktop: { src: "/screens/library-desktop.webp", width: 2560, height: 1600, alt: "A Keep & Cook library on a laptop: a search field and a grid of six saved recipes with photos and cooking times." },
  recipePhone: { src: "/screens/recipe-phone.webp", width: 1170, height: 2532, alt: "A saved roast chicken recipe on a phone, with its source link, time, servings and a Start cooking button." },
  cookPhone: { src: "/screens/cook-phone.webp", width: 1170, height: 2532, alt: "Cooking mode on a phone: step 2 of 4 in large text with Previous and Next step buttons." },
} as const;

type ScreenProps = { screen: (typeof screens)[keyof typeof screens]; className?: string; priority?: boolean };

export function Screen({ screen, className, priority = false }: ScreenProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static captures, already sized and compressed
    <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height}
      loading={priority ? "eager" : "lazy"} decoding="async"
      className={cn("block h-auto w-full rounded-2xl border border-border bg-card", className)} />
  );
}

// A phone-shaped frame around a phone capture; the device edge uses the ink colour.
export function PhoneScreen({ screen, className }: Omit<ScreenProps, "priority">) {
  return (
    <div className={cn("overflow-hidden rounded-[2.25rem] border-[7px] border-foreground bg-card", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static captures, already sized and compressed */}
      <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height} loading="lazy" decoding="async" className="block h-auto w-full" />
    </div>
  );
}
