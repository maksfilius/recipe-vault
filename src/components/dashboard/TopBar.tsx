'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from '@/src/components/ThemeToggle';

export default function Topbar() {
  const pathname = usePathname();

  const section = (() => {
    if (pathname === '/dashboard/favorites') {
      return {
        label: 'Favorites',
        description: 'Your quick-access cookbook.',
      };
    }

    if (pathname === '/dashboard/settings') {
      return {
        label: 'Settings',
        description: 'Profile, password, and account controls.',
      };
    }

    return {
      label: 'Recipes',
      description: 'Your private recipe workspace.',
    };
  })();

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 pt-[env(safe-area-inset-top)] shadow-[0_10px_35px_hsl(var(--background)_/_0.6)] backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
        <div className="min-w-0 flex-1 md:flex-none">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground sm:text-base">
              {section.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {section.description}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
