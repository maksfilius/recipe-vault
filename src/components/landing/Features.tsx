'use client';

import { BookOpen, Filter, ListChecks, Search, SquarePen, View } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useScrollAnimation } from "../../hooks/use-scroll-animation";

const features = [
  {
    icon: SquarePen,
    title: "Capture the full recipe",
    description: "Store ingredients, steps, source links, and notes without splitting recipe details across apps.",
  },
  {
    icon: Search,
    title: "Find dinner fast",
    description: "Search by title and jump back to the recipe you need before the stove is even hot.",
  },
  {
    icon: Filter,
    title: "Browse by cooking context",
    description: "Filter breakfast, lunch, dinner, and snacks to narrow the list to the kind of meal you want to make.",
  },
  {
    icon: View,
    title: "Read while you cook",
    description: "Open a clean detail view with notes, source, ingredients, and step-by-step instructions that stay easy to scan.",
  },
  {
    icon: ListChecks,
    title: "Use it anywhere in the kitchen",
    description: "The dashboard works on desktop and mobile, so recipes stay usable from the desk to the countertop.",
  },
  {
    icon: BookOpen,
    title: "Keep a library that improves over time",
    description: "Update saved recipes, favorite the ones you repeat, and build a cookbook that reflects how you actually cook.",
  },
];

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)_/_0.08),transparent_24%),radial-gradient(circle_at_88%_82%,hsl(var(--muted-foreground)_/_0.06),transparent_24%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Built for the way home cooks actually save recipes
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Keep &amp; Cook focuses on the small set of actions that matter most: save, find, edit, and cook.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group isolate w-full border border-border/60 bg-card/72 shadow-[0_4px_14px_hsl(var(--foreground)_/_0.025)] transition-[transform,opacity] duration-500 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/12 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--primary)_/_0.08))] shadow-[0_4px_14px_hsl(var(--foreground)_/_0.035)] transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--primary)_/_0.12))]">
                  <feature.icon className="h-6 w-6 text-primary" />
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
