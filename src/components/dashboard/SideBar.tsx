'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, ChevronLeft, ChevronRight, Heart, LogOut, Settings } from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon };

const navItems = (): NavItem[] => ([
  { href: `/dashboard`, label: 'Recipes', icon: BookOpen },
  { href: `/dashboard/favorites`, label: 'Favorites', icon: Heart },
  { href: `/dashboard/settings`, label: 'Settings', icon: Settings }
]);

export default function Sidebar({ collapsed, onToggle }:{  collapsed:boolean, onToggle:()=>void  }) {
  const pathname = usePathname();
  const items = navItems();

  return (
    <div className="sticky top-0 flex h-[100dvh] flex-col bg-transparent px-2 py-4 text-white">
      <div className={`px-3 text-sm font-semibold text-white/90 transition-all ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        Recipe Vault
      </div>
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        onClick={onToggle}
        className="absolute right-3 bottom-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur transition hover:bg-white/40"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

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
                  ? 'bg-white/25 font-semibold text-white shadow-lg shadow-primary/20'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              ].join(' ')}
            >
              <Icon className="h-4 w-4 text-white/80" />
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

      <div className="border-t border-white/15 pt-4">
        <button
          className={[
            'flex w-full items-center gap-2 rounded-2xl border border-white/25 px-3 py-3 text-left text-sm text-white transition hover:bg-white/10',
            collapsed ? 'text-center px-0' : ''
          ].join(' ')}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4" />
          <span className={collapsed ? 'sr-only' : ''}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
