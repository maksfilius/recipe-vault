import type { Metadata } from "next";

import Hero from "@/src/components/landing/Hero";
import Features from "@/src/components/landing/Features";
import Footer from "@/src/components/landing/Footer";
import CTA from "@/src/components/landing/CTA";
import Header from "@/src/components/landing/Header";
import { env } from "@/src/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Keep & Cook — Save recipes from websites",
  description: "Turn a recipe link into clear ingredients and steps. Preview for free, then save your favorite recipes in a private cookbook.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
