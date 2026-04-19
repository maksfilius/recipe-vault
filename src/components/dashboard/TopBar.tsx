'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
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
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 shadow-[0_10px_35px_hsl(var(--background)_/_0.6)] backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-foreground shadow-sm transition hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

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
      </div>
    </header>
  );
}
