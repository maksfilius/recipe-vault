"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const root = document.documentElement;
    const stored = window.localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark" ? stored : "dark";

    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.dispatchEvent(new Event("theme-change"));
  }, []);

  return null;
}
