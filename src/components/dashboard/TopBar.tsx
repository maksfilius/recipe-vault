"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type KeyboardEvent } from "react";

import BrandMark from "@/src/components/BrandMark";
import { Input } from "@/src/components/ui/input";
import { readThemePreference, saveThemePreference, type ThemePreference } from "@/src/lib/theme-preference";

type TopBarProps = { onSignOut: () => Promise<void> };
const themeChoices: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function subscribeTheme(onChange: () => void) {
  window.addEventListener("theme-change", onChange);
  return () => window.removeEventListener("theme-change", onChange);
}

export default function TopBar({ onSignOut }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preference = useSyncExternalStore(subscribeTheme, readThemePreference, () => "dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLAnchorElement>(null);
  const searchTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (searchRef.current) searchRef.current.value = searchParams.get("q") ?? "";
  }, [searchParams]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (menuOpen) settingsRef.current?.focus();
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [menuOpen]);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const commitSearch = (query: string) => {
    const value = query.trim();
    if (pathname !== "/dashboard") {
      router.push(value ? `/dashboard?q=${encodeURIComponent(value)}` : "/dashboard");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("q", value);
    else params.delete("q");
    const next = params.toString();
    const href = next ? `/dashboard?${next}` : "/dashboard";
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.pushState(null, "", href);
  };
  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value;
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => commitSearch(query), 350);
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && searchOpen) { setSearchOpen(false); return; }
    if (event.key !== "Enter") return;
    event.preventDefault();
    window.clearTimeout(searchTimer.current);
    commitSearch(event.currentTarget.value);
    if (searchOpen) setSearchOpen(false);
  };
  const openAddRecipe = () => {
    if (pathname === "/dashboard") window.dispatchEvent(new Event("keep-and-cook:add-recipe"));
    else router.push("/dashboard?add=select");
  };
  const onAccountKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      accountButtonRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (!menuOpen) {
      event.preventDefault();
      setMenuOpen(true);
      return;
    }
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
    event.preventDefault();
    items[next].focus();
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link href="/dashboard" aria-label="Keep & Cook, recipes" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-foreground no-underline">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true"><BrandMark className="size-6" /></span>
          <span className="hidden whitespace-nowrap text-base font-bold tracking-tight sm:inline">Keep &amp; Cook</span>
        </Link>

        <div className={`${searchOpen ? "absolute inset-x-0 top-full flex border-b border-border bg-card px-4 py-3 shadow-sm" : "hidden"} min-w-0 flex-1 md:static md:ml-auto md:flex md:max-w-xl md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input ref={searchRef} type="search" aria-label="Search recipes" placeholder="Search recipes" defaultValue={searchParams.get("q") ?? ""} onChange={onSearchChange} onKeyDown={onSearchKeyDown} className="h-11 w-full pl-9" />
          </div>
        </div>

        <button type="button" className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden" aria-label={searchOpen ? "Close search" : "Search recipes"} aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}>
          {searchOpen ? <X className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
        </button>
        <button type="button" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover" aria-label="Add recipe" onClick={openAddRecipe}>
          <Plus className="size-5" aria-hidden="true" />
        </button>

        <div ref={accountRef} className="relative shrink-0" onKeyDown={onAccountKeyDown} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
        }}>
          <button ref={accountButtonRef} type="button" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="account-options" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted" onClick={() => setMenuOpen((open) => !open)}>
            <span className="hidden sm:inline">Account</span><span className="sm:hidden">Me</span><ChevronDown className="size-4" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div id="account-options" role="dialog" aria-label="Account options" className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-xl border border-border bg-card p-2 text-foreground shadow-lg">
              <Link ref={settingsRef} href="/dashboard/settings" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium no-underline hover:bg-muted" onClick={() => setMenuOpen(false)}>Settings</Link>
              <div role="group" aria-label="Theme" className="border-y border-border px-2 py-3">
                <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">Theme</p>
                <div className="grid grid-cols-3 gap-1">
                  {themeChoices.map(({ value, label }) => (
                    <button key={value} type="button" aria-pressed={preference === value} className={`flex min-h-11 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold ${preference === value ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} onClick={() => saveThemePreference(value)}>
                      {preference === value ? <Check className="size-3" aria-hidden="true" /> : null}{label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium hover:bg-muted" onClick={() => { setMenuOpen(false); void onSignOut(); }}>Sign out</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
