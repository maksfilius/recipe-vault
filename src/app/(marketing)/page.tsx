import type { Metadata } from "next";

import Hero from "@/src/components/landing/Hero";
import Features from "@/src/components/landing/Features";
import Footer from "@/src/components/landing/Footer";
import CTA from "@/src/components/landing/CTA";
import Header from "@/src/components/landing/Header";
import { env } from "@/src/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Keep & Cook",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <Header />
      <div id="hero">
        <Hero />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="cta">
        <CTA />
      </div>
      <Footer />
    </div>
  )
}
