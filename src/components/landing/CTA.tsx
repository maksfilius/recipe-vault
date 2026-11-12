import Link from "next/link";
import { ArrowRight, Check, PanelRightOpen } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function CTA() {
  return (
    <>
      <section id="extension" className="scroll-mt-20 border-b border-border bg-background px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">A cleaner recipe, right on the page.</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Our Chrome extension opens a readable recipe beside the website. Preview and cook without an account; save it to your private library when you want to keep it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button disabled className="min-h-12">Add to Chrome <ArrowRight aria-hidden="true" /></Button>
              <span className="text-sm text-muted-foreground">Chrome Web Store release coming soon.</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-label="Illustration of the Chrome extension recipe panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-semibold text-foreground">Keep &amp; Cook</span>
              <PanelRightOpen size={20} className="text-primary" aria-hidden="true" />
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Recipe preview</p>
              <p className="mt-2 font-display text-3xl text-foreground">Tonight’s good find</p>
              <p className="mt-2 text-sm text-muted-foreground">Ingredients and steps, without the page clutter.</p>
              <div className="mt-8 grid gap-7 sm:grid-cols-2">
                <div>
                  <p className="border-b border-border pb-2 text-sm font-semibold text-foreground">Ingredients</p>
                  {["What you need", "Amounts together", "Ready to check off"].map((line) => (
                    <div key={line} className="flex items-center gap-3 border-b border-border py-3 text-sm text-muted-foreground">
                      <span className="h-4 w-4 rounded border border-border" aria-hidden="true" />{line}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="border-b border-border pb-2 text-sm font-semibold text-foreground">Steps</p>
                  <div className="flex gap-3 border-b border-border py-3 text-sm text-muted-foreground"><span className="font-semibold text-primary">1</span>Read each step at your own pace.</div>
                  <div className="flex gap-3 border-b border-border py-3 text-sm text-muted-foreground"><span className="font-semibold text-primary">2</span>Cook with the source close by.</div>
                </div>
              </div>
              <div className="mt-7 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground"><Check size={17} className="text-primary" aria-hidden="true" /> No account needed to preview</div>
            </div>
          </div>
        </div>
      </section>
      <section id="cta" className="bg-card px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Make room for recipes worth keeping.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Start with a link above or create a free cookbook for the recipes you return to.</p>
          <Button asChild size="lg" className="mt-8"><Link href="/register">Create your cookbook <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </>
  );
}
