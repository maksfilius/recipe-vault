import Link from "next/link";
import { ArrowRight } from "lucide-react";

import AddToChrome from "@/src/components/landing/AddToChrome";
import { Screen, screens } from "@/src/components/landing/Screen";
import { marketingMetadata } from "@/src/lib/page-metadata";

export const metadata = marketingMetadata({
  title: "Keep & Cook for Chrome — Recipe Saver & Reader",
  description: "Read any recipe without the clutter in Chrome’s side panel, cook it step by step with timers, download it, or save it to your free Keep & Cook cookbook.",
  path: "/chrome-extension",
});

const features = [
  ["Read the recipe, not the page", "Click the icon on a recipe page and Chrome’s side panel shows the photo, time, servings, ingredients and steps. Tick off ingredients as you gather them."],
  ["Cook step by step", "Start cooking and the recipe fills the window: one large step at a time, timers from the times in the recipe, the ingredient list one tap away, and a screen that stays on. Close it and you’re back on the original page."],
  ["Download it", "Keep a plain text copy of any recipe the panel can read, with a link to where it came from."],
  ["Save it to your cookbook", "Choose Save to my recipes. Keep & Cook opens with the recipe ready to check and edit, and nothing is saved until you choose Save. Already saved? You’ll get the recipe you have instead of a copy."],
] as const;

const steps = [
  ["Add Keep & Cook to Chrome", "A welcome page opens once it’s installed."],
  ["Pin the icon", "Open the puzzle-piece menu in Chrome’s toolbar and click the pin next to Keep & Cook."],
  ["Open a recipe and click the icon", "The side panel opens beside the page with the recipe it found."],
  ["Cook, download or save", "Start cooking right there, download a copy, or save it to your free cookbook."],
] as const;

export default function ChromeExtensionPage() {
  return (
    <>
      <section aria-labelledby="extension-page-title" className="border-b border-border bg-background px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-20">
          <div className="max-w-xl">
            <h1 id="extension-page-title" className="font-display text-balance text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.035em] text-foreground">Read, cook and save recipes in Chrome.</h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-8 text-muted-foreground sm:text-xl">
              Keep &amp; Cook puts the recipe beside the page, without the life story and the pop-ups. Reading, cooking and downloading are free and need no account.
            </p>
            <div className="mt-8"><AddToChrome /></div>
          </div>
          <div className="mx-auto h-[43rem] w-full max-w-[20rem] overflow-hidden rounded-2xl border border-border">
            <Screen screen={screens.extensionPanel} priority className="rounded-none border-0" />
          </div>
        </div>
      </section>

      <section aria-labelledby="extension-features-title" className="border-b border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 id="extension-features-title" className="max-w-2xl font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">What it does on a recipe page.</h2>
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <dl className="border-t border-border">
              {features.map(([title, detail]) => (
                <div key={title} className="border-b border-border py-6">
                  <dt className="font-display text-2xl text-foreground">{title}</dt>
                  <dd className="mt-2 leading-7 text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
            <Screen screen={screens.extensionCooking} className="lg:mt-6" />
          </div>
        </div>
      </section>

      <section aria-labelledby="extension-start-title" className="border-b border-border bg-background px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="extension-start-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Get started in a minute.</h2>
            <ol className="mt-10 border-t border-border">
              {steps.map(([title, detail], index) => (
                <li key={title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-border py-6">
                  <span aria-hidden="true" className="font-display text-2xl text-primary">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 leading-7 text-muted-foreground">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-12 lg:pt-3">
            <div>
              <h2 className="font-display text-3xl text-foreground">Where it works</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Chrome 116 or newer on a computer. It reads most recipe sites that publish recipe data. When a page has none, the extension asks Keep &amp; Cook to read that public page instead. If there is no recipe to find, the panel says so, and you can add the recipe by hand in your cookbook. Chrome’s own pages, the Chrome Web Store and PDFs can’t be read.</p>
            </div>
            <div>
              <h2 className="font-display text-3xl text-foreground">Your privacy</h2>
              <p className="mt-4 leading-7 text-muted-foreground">The extension reads a page only when you click its icon on that page, and it has no access to the sites you browse otherwise. It has no analytics and no ads, and it never stores your password. Saving happens on keepandcook.com after you sign in.</p>
              <Link href="/privacy" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">Read the privacy policy <ArrowRight aria-hidden="true" size={18} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="extension-next-title" className="bg-card px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 id="extension-next-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Then take it to the kitchen.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Recipes you save are in your cookbook on every device. Add Keep &amp; Cook to your phone’s home screen and cook from there.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link href="/install" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">Install on your phone <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-foreground underline-offset-4 hover:underline">Create your free cookbook</Link>
          </div>
        </div>
      </section>
    </>
  );
}
