'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/src/assets/Logo.svg";

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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-3 text-xl font-bold text-foreground transition-opacity hover:opacity-80"
        >
          <Image
            src={logo}
            alt="Keep & Cook logo"
            className="h-9 w-auto"
            priority
          />
          <span>Keep &amp; Cook</span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          <button onClick={() => scrollToSection("features")} className="text-foreground/80 transition-colors hover:text-foreground">
            Features
          </button>
          <button onClick={() => scrollToSection("cta")} className="text-foreground/80 transition-colors hover:text-foreground">
            Get Started
          </button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-foreground transition-colors hover:text-primary md:hidden"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="border-b border-border/60 bg-background md:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">
            <button
              onClick={() => scrollToSection("features")}
              className="py-2 text-left text-foreground/80 transition-colors hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("cta")}
              className="py-2 text-left text-foreground/80 transition-colors hover:text-foreground"
            >
              Get Started
            </button>
            <Button size="sm" className="w-full" variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="w-full" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
