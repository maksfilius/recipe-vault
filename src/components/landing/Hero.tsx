"use client";

import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

const Hero = () => {
  const scrollYRef = useRef(0);
  const bgRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          const y = scrollYRef.current;
          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${y * 0.5}px) scale(${1 + y * 0.0002})`;
          }
          ticking.current = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 transition-transform duration-75 ease-out will-change-transform"
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in hsl, var(--color-primary) 95%, transparent), color-mix(in hsl, var(--color-muted) 85%, transparent))",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="container relative z-10 px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in">
          Your Kitchen's Best Friend
        </h1>

        <p
          className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto animate-fade-in-delayed"
        >
          Store, organize, and discover your favorite recipes all in one place. Never lose a family recipe again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-more">
          <Button size="lg" variant="primary" className="text-lg px-8">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
          >
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
