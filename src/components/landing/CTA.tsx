import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function CTA() {
  return (
    <section id="cta" aria-labelledby="cta-title" className="bg-background px-5 py-20 text-center sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 id="cta-title" className="font-display text-balance text-4xl leading-[1.12] tracking-[-0.025em] text-foreground sm:text-5xl">Make room for recipes worth keeping.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Start with a link above, or create your free cookbook for the recipes you come back to.</p>
        <Button asChild size="lg" className="mt-8"><Link href="/register">Create your free cookbook <ArrowRight aria-hidden="true" /></Link></Button>
      </div>
    </section>
  );
}
