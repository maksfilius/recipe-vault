'use client';

import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "../../hooks/use-scroll-animation";

const CTA = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-gradient-to-br from-primary to-accent overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6">
        <div
          ref={ref}
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to Transform Your Cooking?
          </h2>

          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of home cooks who've organized their recipe collections and rediscovered the joy of cooking.
          </p>

          <div className="flex justify-center">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-white/10 backdrop-blur-sm border-primary-foreground/40 text-primary-foreground hover:bg-white/20 hover:scale-105 transition-transform duration-300"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/75 mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
