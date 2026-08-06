'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from './BottomNav';
import Sidebar from './SideBar';
import Topbar from './TopBar';
import { supabase } from '@/src/lib/supabase-client';
import { clearOfflineRecipeData } from '@/src/lib/offline-recipes';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sidebar:collapsed');

      if (stored === '1') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Failed to sign out', error);
      return;
    }

    await clearOfflineRecipeData();
    router.replace('/login');
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background text-foreground before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_18%_16%,hsl(var(--primary)_/_0.22),transparent_34%),radial-gradient(circle_at_82%_12%,hsl(var(--accent)_/_0.12),transparent_28%)] before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)_/_0.42))] after:content-['']">
      <div
        className="relative mx-auto flex h-[100dvh] w-full flex-col bg-background/35 shadow-[0_35px_120px_hsl(var(--foreground)_/_0.08)] md:grid md:border-x md:border-border/50"
        style={{
          gridTemplateColumns: `${collapsed ? '4rem' : '12rem'} 1fr`,
          backgroundImage:
            'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.5) 48%, hsl(var(--primary) / 0.14) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <aside className="relative z-10 hidden h-full border-r border-border/55 bg-card/72 text-foreground shadow-[0_24px_80px_hsl(var(--foreground)_/_0.08)] backdrop-blur-2xl md:block">
          <Sidebar collapsed={collapsed} onToggle={handleToggle} onSignOut={handleSignOut} />
        </aside>

        {/* flex-1 + min-h-0 are what make `main` fill the viewport on mobile. Without
            them this column is sized by its content, so any child that wants to fill
            the visible height (the recipe deck) collapses instead. On md+ the parent
            is a grid and stretch already handles it. */}
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card/88 text-foreground md:pb-[env(safe-area-inset-bottom)] shadow-[0_25px_80px_hsl(var(--foreground)_/_0.1)] backdrop-blur-2xl md:border-l md:border-border/35">
          <Topbar />
          {/* overflow-x must be stated: with only overflow-y set, CSS computes the other
              axis to auto, and Swiper's cards effect runs with overflow:visible, so the
              stacked cards made this pannable sideways. */}
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 lg:p-10">{children}</main>
          <BottomNav />
        </div>
      </div>

    </div>
  );
}
