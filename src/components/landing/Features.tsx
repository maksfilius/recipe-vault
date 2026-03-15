'use client';

import { BookOpen, Filter, ListChecks, Search, SquarePen, View } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useScrollAnimation } from "../../hooks/use-scroll-animation";

const features = [
  {
    icon: SquarePen,
    title: "Create & edit recipes",
    description: "Add title, description, ingredients, steps, source link, and image in one flow.",
  },
  {
    icon: Search,
    title: "Fast title search",
    description: "Find recipes instantly while typing with a lightweight search experience.",
  },
  {
    icon: Filter,
    title: "Category filters",
    description: "Switch between categories and combine them with search for faster browsing.",
  },
  {
    icon: View,
    title: "Readable details view",
    description: "See recipe notes, source, ingredients, and full step-by-step instructions.",
  },
  {
    icon: ListChecks,
    title: "Mobile-ready dashboard",
    description: "Use the same key actions on desktop and mobile with an adaptive layout.",
  },
  {
    icon: BookOpen,
    title: "Clean recipe library",
    description: "Keep all your personal recipes in one place and update them over time.",
  },
];

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Built Around Real Workflows
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            No filler features. Everything below reflects what you can use right now.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group w-full border border-border/60 bg-card/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_hsl(var(--background)_/_0.7)] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 transition-all duration-300 group-hover:bg-primary/25">
                  <feature.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};


export default Features;
