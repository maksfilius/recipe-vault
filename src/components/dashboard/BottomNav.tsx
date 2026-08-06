"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Settings, type LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Recipes", icon: BookOpen },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/**
 * Phone navigation. It replaces the drawer rather than sitting beside it: three
 * destinations belong on a tab bar, and a menu that has to be opened first is a
 * step the app does not need. Signing out moved to Settings, where an installed
 * app would keep it.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    // A flex sibling of <main>, not a fixed overlay, so main simply gets shorter
    // and anything sizing itself to the visible height stays correct. The bottom
    // inset lives on the bar so its background reaches the screen edge.
    <nav
      aria-label="Sections"
      className="shrink-0 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium no-underline transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                ].join(" ")}
              >
                <Icon className={isActive ? "h-5 w-5" : "h-5 w-5 opacity-80"} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
