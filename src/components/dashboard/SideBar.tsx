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
  onNavigate
}: SidebarProps) {
  const pathname = usePathname();
  const items = navItems();

  return (
    <div className="sticky top-0 flex h-[100dvh] flex-col bg-transparent px-2 py-4 text-foreground">
      <div className={`px-3 text-sm font-semibold text-foreground transition-all flex items-center h-14 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        Recipe Vault
      </div>
      {showCollapseToggle && (
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
          onClick={onToggle}
          className="absolute right-4 bottom-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-foreground/10 text-foreground shadow-sm backdrop-blur transition hover:bg-foreground/20"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
                'group flex items-center rounded-2xl px-4 py-3 text-sm no-underline transition-all',
                collapsed ? 'justify-center' : 'gap-3',
                active
                  ? 'bg-primary/20 font-semibold text-foreground'
                  : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
              ].join(' ')}
              onClick={() => onNavigate?.()}
            >
              <Icon className="h-4 w-4 text-foreground/80" />
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
          className={[
            'flex w-full items-center gap-2 rounded-2xl border border-border/60 px-3 py-3 text-left text-sm text-foreground transition hover:bg-foreground/10',
            collapsed ? 'text-center px-0' : ''
          ].join(' ')}
          onClick={() => onNavigate?.()}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4" />
          <span className={collapsed ? 'sr-only' : ''}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
