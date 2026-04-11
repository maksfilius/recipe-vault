'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, ChevronLeft, ChevronRight, Heart, LogOut, Settings } from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon };

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  showCollapseToggle?: boolean;
  onNavigate?: () => void;
  onSignOut?: () => void;
};

const navItems = (): NavItem[] => ([
  { href: `/dashboard`, label: 'Recipes', icon: BookOpen },
  { href: `/dashboard/favorites`, label: 'Favorites', icon: Heart },
  { href: `/dashboard/settings`, label: 'Settings', icon: Settings }
]);

export default function Sidebar({
  collapsed,
  onToggle,
  showCollapseToggle = true,
  onNavigate,
  onSignOut
}: SidebarProps) {
  const pathname = usePathname();
  const items = navItems();
  const collapsedIconClass = 'h-5 w-5 text-foreground';

  return (
    <div className="sticky top-0 flex h-[100dvh] flex-col bg-transparent px-2 py-3 text-foreground">
      <div className={`px-3 text-sm font-semibold text-foreground transition-all flex items-center h-14 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        RecipeVault
      </div>
      {showCollapseToggle && (
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
          onClick={onToggle}
          className="absolute right-3 bottom-16 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-foreground/10 text-foreground shadow-sm backdrop-blur transition hover:bg-foreground/20"
        >
          {collapsed ? <ChevronRight className={collapsed ? collapsedIconClass : 'h-4 w-4'} /> : <ChevronLeft className={collapsed ? collapsedIconClass : 'h-4 w-4'} />}
        </button>
      )}

      <nav className="mt-6 flex-1 space-y-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={[
                'group flex items-center rounded-2xl text-sm no-underline transition-all',
                collapsed ? 'justify-center px-2 py-2.5 text-foreground hover:text-foreground' : 'gap-3 px-4 py-3',
                active
                  ? 'bg-primary/20 font-semibold text-foreground'
                  : collapsed
                    ? 'text-foreground hover:bg-foreground/10'
                    : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
              ].join(' ')}
              onClick={() => onNavigate?.()}
            >
              <Icon className={collapsed ? collapsedIconClass : 'h-4 w-4 text-foreground/80'} />
              <span
                className={[
                  'transition-[opacity,width] overflow-hidden',
                  collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                ].join(' ')}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 pt-4">
        <button
          type="button"
          className={[
            'flex w-full items-center rounded-2xl border border-border/60 text-left text-sm text-foreground transition hover:bg-foreground/10',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-3'
          ].join(' ')}
          onClick={onSignOut}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className={collapsed ? collapsedIconClass : 'h-4 w-4'} />
          <span className={collapsed ? 'sr-only' : ''}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
