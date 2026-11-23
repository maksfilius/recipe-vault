import CookbookSection from "@/src/components/landing/CookbookSection";
import CTA from "@/src/components/landing/CTA";
import ExtensionSection from "@/src/components/landing/ExtensionSection";
import Hero from "@/src/components/landing/Hero";
import WaysToSave from "@/src/components/landing/WaysToSave";
import { marketingMetadata } from "@/src/lib/page-metadata";

export const metadata = marketingMetadata({
  title: "Keep & Cook — Save recipes. Cook without distractions.",
  description: "Save recipes from any website, cook step by step without the clutter, and keep them in a free personal cookbook on your laptop and phone.",
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WaysToSave />
      <ExtensionSection />
      <CookbookSection />
      <CTA />
    </>
  );
}
