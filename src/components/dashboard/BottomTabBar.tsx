"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Settings } from "lucide-react";

const tabClass = "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline";

// Phone navigation (< 640 px). Search toggles the TopBar's search panel; Add uses the same
// event as the header's "+" button so the dashboard opens its add dialog.
export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const onDashboard = pathname === "/dashboard";
  const tone = (active: boolean) => (active ? "text-primary" : "text-muted-foreground hover:text-foreground");

  const openSearch = () => {
    if (!onDashboard) router.push("/dashboard");
    window.dispatchEvent(new Event("keep-and-cook:open-search"));
  };
  const addRecipe = () => {
    if (onDashboard) window.dispatchEvent(new Event("keep-and-cook:add-recipe"));
    else router.push("/dashboard?add=select");
  };

  return (
    <nav aria-label="Main" className="shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="mx-auto flex max-w-md items-stretch px-2">
        <Link href="/dashboard" aria-current={onDashboard ? "page" : undefined} className={`${tabClass} ${tone(onDashboard)}`}>
          <BookOpen className="size-5" aria-hidden="true" />Recipes
        </Link>
        <button type="button" onClick={openSearch} className={`${tabClass} ${tone(false)}`}>
          <Search className="size-5" aria-hidden="true" />Search
        </button>
        <button type="button" onClick={addRecipe} aria-label="Add recipe" className={`${tabClass} text-muted-foreground`}>
          <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm" aria-hidden="true"><Plus className="size-5" /></span>
        </button>
        <Link href="/dashboard/settings" aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
          className={`${tabClass} ${tone(pathname === "/dashboard/settings")}`}>
          <Settings className="size-5" aria-hidden="true" />Settings
        </Link>
      </div>
    </nav>
  );
}
