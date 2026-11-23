import Link from "next/link";
import { ArrowRight, EllipsisVertical, Share, SquarePlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { PhoneScreen, screens } from "@/src/components/landing/Screen";
import { marketingMetadata } from "@/src/lib/page-metadata";

export const metadata = marketingMetadata({
  title: "Install Keep & Cook on iPhone and Android",
  description: "Add Keep & Cook to your phone’s home screen in a few taps. Your cookbook opens like an app, with cooking mode, and stays readable offline.",
  path: "/install",
});

type Step = { text: string; icon?: LucideIcon };

const platforms: { id: string; name: string; browser: string; steps: Step[] }[] = [
  {
    id: "iphone",
    name: "iPhone and iPad",
    browser: "Safari",
    steps: [
      { text: "Open keepandcook.com in Safari and sign in." },
      { text: "Tap the Share button in the toolbar.", icon: Share },
      { text: "Scroll down and tap Add to Home Screen.", icon: SquarePlus },
      { text: "Tap Add. Keep & Cook appears on your home screen." },
    ],
  },
  {
    id: "android",
    name: "Android",
    browser: "Chrome",
    steps: [
      { text: "Open keepandcook.com in Chrome and sign in." },
      { text: "Tap the menu button in the top corner.", icon: EllipsisVertical },
      { text: "Tap Add to Home screen or Install app." },
      { text: "Confirm with Install. Keep & Cook appears with your apps." },
    ],
  },
];

export default function InstallPage() {
  return (
    <>
      <section aria-labelledby="install-title" className="border-b border-border bg-background px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-20">
          <div className="max-w-xl">
            <h1 id="install-title" className="font-display text-balance text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.035em] text-foreground">Your cookbook, on your phone.</h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-8 text-muted-foreground sm:text-xl">
              Keep &amp; Cook works from your home screen like an app: no app store, no download. It opens straight to your recipes, in its own window.
            </p>
            <nav aria-label="Choose your phone" className="mt-8 flex flex-wrap gap-3">
              {platforms.map(({ id, name }) => (
                <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 font-semibold text-foreground hover:bg-muted">{name}</a>
              ))}
            </nav>
          </div>
          <div className="mx-auto grid w-full max-w-md grid-cols-2 items-start gap-4 sm:gap-6">
            <PhoneScreen screen={screens.recipePhone} />
            <PhoneScreen screen={screens.cookPhone} className="mt-12" />
          </div>
        </div>
      </section>

      <section aria-label="Installation steps" className="border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:gap-20">
          {platforms.map(({ id, name, browser, steps }) => (
            <div key={id} id={id} className="scroll-mt-24">
              <h2 className="font-display text-4xl leading-[1.12] tracking-[-0.025em] text-foreground">{name}</h2>
              <p className="mt-3 text-muted-foreground">In {browser}</p>
              <ol className="mt-8 border-t border-border">
                {steps.map(({ text, icon: Icon }, index) => (
                  <li key={text} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-border py-5">
                    <span aria-hidden="true" className="font-display text-2xl text-primary">{index + 1}</span>
                    <p className="flex flex-wrap items-center gap-x-2 leading-7 text-foreground">
                      {text}
                      {Icon && <Icon aria-hidden="true" size={20} className="text-muted-foreground" />}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="install-offline-title" className="border-b border-border bg-background px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-20">
          <h2 id="install-offline-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Cooking where the signal is weak.</h2>
          <div className="space-y-5 text-lg leading-8 text-muted-foreground">
            <p>Once you’ve opened your library online, your recipes stay readable on that phone without a connection, cooking mode included.</p>
            <p>Adding, editing or deleting a recipe needs a connection, so nothing gets lost between devices. Signing out clears the offline copy.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="install-next-title" className="bg-card px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 id="install-next-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">No cookbook yet?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Create one for free, then save recipes from a link, from Chrome, or by hand.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button asChild size="lg"><Link href="/register">Create your free cookbook <ArrowRight aria-hidden="true" /></Link></Button>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-foreground underline-offset-4 hover:underline">Open my recipes</Link>
          </div>
        </div>
      </section>
    </>
  );
}
