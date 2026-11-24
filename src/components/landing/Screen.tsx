import { cn } from "@/src/lib/utils";

// Real Keep & Cook screens captured with the demo cookbook (scripts/store/capture-screens.mjs).
export const screens = {
  extensionBrowser: { src: "/screens/extension-browser.webp", width: 2560, height: 1600, alt: "A desktop Chrome window: a cluttered recipe blog with ads and a cookie banner on the left, and the Keep & Cook side panel on the right showing the same roast chicken recipe with its photo, time and servings, and Save to my recipes and Start cooking buttons." },
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

// The extension in a desktop Chrome window (scripts/store/capture-browser.mjs). Below sm the capture is
// cropped to its top right, where the toolbar and the side panel are, instead of shrinking the whole window.
export function BrowserScreen({ className, priority = false }: { className?: string; priority?: boolean }) {
  const screen = screens.extensionBrowser;
  return (
    <figure className={className}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card sm:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- static captures, already sized and compressed */}
        <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height}
          loading={priority ? "eager" : "lazy"} decoding="async"
          className="absolute right-0 top-0 h-auto w-[192%] max-w-none sm:static sm:block sm:w-full" />
      </div>
      <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">Keep &amp; Cook in Chrome’s side panel, on a computer.</figcaption>
    </figure>
  );
}

// A phone-shaped frame around a phone capture. Bezel and corners are in container units of the frame's
// own width, so a small phone on a narrow screen keeps a phone's proportions instead of a thick pill.
// The bezel is the light theme's ink in both themes, with a hairline to separate it from a dark page.
export function PhoneScreen({ screen, className }: Omit<ScreenProps, "priority">) {
  return (
    <div className={cn("@container", className)}>
      <div className="rounded-[15cqw] bg-[hsl(268_20%_14%)] p-[3.2cqw] shadow-[0_0_0_1px_hsl(var(--border)),0_24px_48px_-20px_rgb(0_0_0/0.45)]">
        <div className="overflow-hidden rounded-[11.8cqw] bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- static captures, already sized and compressed */}
          <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height} loading="lazy" decoding="async" className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
