'use client';

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { useScrollAnimation } from "../../hooks/use-scroll-animation";
import ctaBackground from "@/src/assets/CTA.png";

const CTA = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--background) / 0.34), hsl(var(--background) / 0.74)), url(${ctaBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--background) / 0.34), hsl(var(--background) / 0.74)), url(${ctaBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)_/_0.32),transparent_45%),linear-gradient(180deg,hsl(var(--background)_/_0.08),hsl(var(--background)_/_0.38))]" />
      <div className="mx-auto max-w-7xl px-6">
        <div
          ref={ref}
          className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Stop hunting through notes, tabs, and screenshots
          </h2>

          <p className="mb-8 text-xl text-foreground/90">
            Create your Keep &amp; Cook account and keep your go-to recipes in a dashboard that is ready every time you cook.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="primary" className="px-8 text-lg" asChild>
              <Link href="/register">Create account</Link>
            </Button>
            <Button size="lg" variant="ghost" className="border border-foreground/30 bg-foreground/10 px-8 text-lg text-foreground hover:bg-foreground/20" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
