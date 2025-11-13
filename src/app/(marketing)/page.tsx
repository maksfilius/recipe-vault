import Hero from "@/src/components/landing/Hero";
import Features from "@/src/components/landing/Features";
import Footer from "@/src/components/landing/Footer";
import CTA from "@/src/components/landing/CTA";
import Header from "@/src/components/landing/Header";

export default function LangingPage() {
  return (
    <div className="min-h-screen scroll-smooth">
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