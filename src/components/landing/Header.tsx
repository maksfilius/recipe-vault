'use client'

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Menu, X, ChefHat } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          <ChefHat className="w-8 h-8" />
          <span>RecipeVault</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection("features")} className="text-foreground/80 hover:text-primary transition-colors">
            Features
          </button>
          <button onClick={() => scrollToSection("cta")} className="text-foreground/80 hover:text-primary transition-colors">
            Get Started
          </button>
          <Button size="sm">Sign In</Button>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("features")}
              className="text-left text-foreground/80 hover:text-primary transition-colors py-2"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("stats")}
              className="text-left text-foreground/80 hover:text-primary transition-colors py-2"
            >
              Stats
            </button>
            <button
              onClick={() => scrollToSection("cta")}
              className="text-left text-foreground/80 hover:text-primary transition-colors py-2"
            >
              Get Started
            </button>
            <Button size="sm" className="w-full">Sign In</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
