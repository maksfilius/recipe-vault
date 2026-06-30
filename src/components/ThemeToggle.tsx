"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/src/components/ui/button";

type Theme = "light" | "dark";
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleThemeChange = () => onStoreChange();

  window.addEventListener("theme-change", handleThemeChange);
  mediaQuery.addEventListener("change", handleThemeChange);

  return () => {
    window.removeEventListener("theme-change", handleThemeChange);
    mediaQuery.removeEventListener("change", handleThemeChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  const toggleTheme = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const viewTransitionDocument = document as ViewTransitionDocument;
    const canAnimate =
      typeof viewTransitionDocument.startViewTransition === "function" && !prefersReducedMotion;

    if (!canAnimate) {
      applyTheme(nextTheme);
      window.dispatchEvent(new Event("theme-change"));
      return;
    }

    const { top, left, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = viewTransitionDocument.startViewTransition!(() => {
      applyTheme(nextTheme);
      window.dispatchEvent(new Event("theme-change"));
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
      className="border border-border/70 bg-card shadow-none"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
