'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './SideBar';
import Topbar from './TopBar';
import { supabase } from '@/src/lib/supabase-client';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    closeMobileSidebar();

    if (error) {
      console.error('Failed to sign out', error);
      return;
    }

    router.replace('/login');
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background text-foreground before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_18%_16%,hsl(var(--primary)_/_0.22),transparent_34%),radial-gradient(circle_at_82%_12%,hsl(var(--accent)_/_0.12),transparent_28%)] before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)_/_0.42))] after:content-['']">
      <div
        className="relative mx-auto flex h-[100dvh] w-full flex-col border-x border-border/50 bg-background/35 shadow-[0_35px_120px_hsl(var(--foreground)_/_0.08)] md:grid"
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

        <div className="relative z-10 flex min-w-0 flex-col overflow-hidden border-l border-border/35 bg-card/88 text-foreground shadow-[0_25px_80px_hsl(var(--foreground)_/_0.1)] backdrop-blur-2xl">
          <Topbar onMenuClick={openMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-10 min-h-0 ">{children}</main>
        </div>
      </div>

      <div
        className={[
          'fixed inset-0 z-40 bg-background/72 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        aria-hidden
        onClick={closeMobileSidebar}
      />

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] border-r border-border/55 bg-card/94 text-foreground shadow-2xl backdrop-blur md:hidden',
          'transition-transform duration-300 ease-out',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <Sidebar
          collapsed={false}
          onToggle={() => {}}
          showCollapseToggle={false}
          onNavigate={closeMobileSidebar}
          onSignOut={handleSignOut}
        />
      </div>
    </div>
  );
}
