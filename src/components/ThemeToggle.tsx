"use client";

import { Moon, Sun } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { Button } from "@/src/components/ui/button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const toggleTheme = async (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAnimate = typeof document.startViewTransition === "function" && !prefersReducedMotion;

    if (!canAnimate) {
      setTheme(nextTheme);
      applyTheme(nextTheme);
      return;
    }

    const { top, left, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition!(() => {
      setTheme(nextTheme);
      applyTheme(nextTheme);
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        opacity: [0.72, 1],
      },
      {
        duration: 950,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="border border-border/70 bg-card/75 shadow-[0_10px_24px_hsl(var(--foreground)_/_0.08)] backdrop-blur-sm"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
