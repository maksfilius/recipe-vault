"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { useEffect, useRef } from "react";
import heroBackground from "@/src/assets/Hero.png";

const Hero = () => {
  const scrollYRef = useRef(0);
  const bgRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

    if (isReducedMotion || isMobileViewport) {
      return;
    }

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          const y = scrollYRef.current;
          if (bgRef.current) {
            bgRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + y * 0.00008})`;
          }
          ticking.current = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pt-20">
      <div
        className="absolute inset-0 z-0 transition-transform duration-75 ease-out will-change-transform md:hidden"
        style={{
          backgroundImage:
            `linear-gradient(180deg, hsl(var(--background) / 0.48), hsl(var(--background) / 0.82)), radial-gradient(1200px 500px at 25% 0%, color-mix(in hsl, var(--color-primary) 55%, transparent), transparent), radial-gradient(1000px 500px at 80% 100%, color-mix(in hsl, var(--color-muted) 65%, transparent), transparent), url(${heroBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      />
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 hidden transition-transform duration-75 ease-out will-change-transform md:block"
        style={{
          backgroundImage:
            `linear-gradient(180deg, hsl(var(--background) / 0.48), hsl(var(--background) / 0.82)), radial-gradient(1200px 500px at 25% 0%, color-mix(in hsl, var(--color-primary) 55%, transparent), transparent), radial-gradient(1000px 500px at 80% 100%, color-mix(in hsl, var(--color-muted) 65%, transparent), transparent), url(${heroBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "56% center",
        }}
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(120deg,hsl(var(--background)_/_0.28),transparent_42%,hsl(var(--background)_/_0.42))]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 text-center">
        <h1 className="animate-fade-in text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
          Your personal recipe library, organized for real weeknight cooking.
        </h1>

        <p className="animate-fade-in-delayed mx-auto mt-5 max-w-3xl text-lg text-foreground/85 sm:text-xl">
          Save ingredients, steps, source links, and favorites in one place so dinner ideas are easy to find when you need them.
        </p>

        <div className="animate-fade-in-more mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <Button size="lg" variant="primary" className="px-7 text-base" asChild>
            <Link href="/register">Start free</Link>
          </Button>
          <Button size="lg" variant="ghost" className="border border-border/60 px-7 text-base" asChild>
            <Link href="/login">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
