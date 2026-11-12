export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function normalizeThemePreference(value: string | null): ThemePreference {
  return value === "system" || value === "light" || value === "dark" ? value : "dark";
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  try { return normalizeThemePreference(window.localStorage.getItem("theme")); }
  catch { return "dark"; }
}

export function applyThemePreference(preference: ThemePreference) {
  const theme = resolveTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event("theme-change"));
}

export function saveThemePreference(preference: ThemePreference) {
  try { window.localStorage.setItem("theme", preference); } catch {}
  applyThemePreference(preference);
}
