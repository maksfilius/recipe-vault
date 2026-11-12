"use client";

import { useEffect } from "react";
import { applyThemePreference, readThemePreference } from "@/src/lib/theme-preference";

export default function ThemeInitializer() {
  useEffect(() => {
    applyThemePreference(readThemePreference());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (readThemePreference() === "system") applyThemePreference("system");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  return null;
}
