import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AddToChrome from "./AddToChrome";
import { BrowserScreen } from "./Screen";

export default function ExtensionSection() {
  return (
    <section id="extension" aria-labelledby="extension-title" className="scroll-mt-20 border-b border-border bg-background px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-x-20 gap-y-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-end">
          <h2 id="extension-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">A cleaner recipe, right beside the page.</h2>
          <div>
            <p className="max-w-lg text-lg leading-8 text-muted-foreground">
              The Keep &amp; Cook extension opens the recipe in Chrome’s side panel: ingredients to tick off, steps to follow, cooking mode with timers. Reading and cooking need no account. Save it to your cookbook when you want to keep it.
            </p>
            <div className="mt-8"><AddToChrome /></div>
            <Link href="/chrome-extension" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
              See how the extension works <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
        <BrowserScreen className="mt-12 sm:mt-14" />
      </div>
    </section>
  );
}
