'use client';

import { BookOpen, Search, Share2, Heart, Clock, Sparkles } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useScrollAnimation } from "../../hooks/use-scroll-animation";

const features = [
  {
    icon: BookOpen,
    title: "Organize Everything",
    description: "Keep all your recipes in one beautifully organized digital cookbook.",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any recipe instantly with powerful search and filtering.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share your favorite recipes with friends and family effortlessly.",
  },
  {
    icon: Heart,
    title: "Save Favorites",
    description: "Mark your go-to recipes and build your personal collection.",
  },
  {
    icon: Clock,
    title: "Meal Planning",
    description: "Plan your weekly meals and generate shopping lists automatically.",
  },
  {
    icon: Sparkles,
    title: "Import from Web",
    description: "Save recipes from any website with just one click.",
  },
];

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto max-w-7xl px-6">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you manage your recipe collection like a pro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group w-full max-w-sm border border-border hover:shadow-[var(--card-hover-shadow)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 mx-auto">
                  <feature.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
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
