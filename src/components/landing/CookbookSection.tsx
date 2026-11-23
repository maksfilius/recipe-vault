import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhoneScreen, Screen, screens } from "./Screen";

const facts = [
  ["Free and private", "Your recipes belong to your account. Nobody else sees them."],
  ["On every device", "Sign in on your laptop or phone and the same recipes are there."],
  ["Cooking mode", "Large steps, timers from the recipe, and a screen that stays on."],
  ["Yours to keep", "Search everything you’ve saved, and download your whole cookbook any time."],
] as const;

export default function CookbookSection() {
  return (
    <section id="cookbook" aria-labelledby="cookbook-title" className="scroll-mt-20 overflow-hidden border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:items-end lg:gap-20">
          <h2 id="cookbook-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Your cookbook, wherever you cook.</h2>
          <p className="max-w-lg text-lg leading-8 text-muted-foreground">Recipes you save live in your free Keep &amp; Cook account, not in one browser. Plan on the laptop, cook from your phone.</p>
        </div>
        <div className="relative mt-14 pb-10 pr-[18%] sm:pr-[14%]">
          <Screen screen={screens.libraryDesktop} />
          <PhoneScreen screen={screens.cookPhone} className="absolute bottom-0 right-0 w-[30%] max-w-64 sm:w-[24%]" />
        </div>
        <dl className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([title, detail]) => (
            <div key={title} className="py-6">
              <dt className="font-display text-xl text-foreground">{title}</dt>
              <dd className="mt-2 leading-7 text-muted-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
        <Link href="/install" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
          Put Keep &amp; Cook on your phone <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
