"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/src/components/ui/button";

type Theme = "light" | "dark";

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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.dispatchEvent(new Event("theme-change"));
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
