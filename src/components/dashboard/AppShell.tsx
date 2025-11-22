'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './SideBar';
import Topbar from './TopBar';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
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

  return (
    <div className="cursor-pointer relative min-h-[100dvh] overflow-hidden bg-background text-foreground before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)_/_0.3),transparent_55%)] before:opacity-60 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-background/70 after:content-['']">
      <div
        className="relative mx-auto flex min-h-[100dvh] w-full flex-col border-x border-border/60 bg-background/20 shadow-[0_35px_120px_hsl(var(--background)_/_0.65)] md:grid"
        style={{
          gridTemplateColumns: `${collapsed ? '4rem' : '12rem'} 1fr`,
          backgroundImage: `linear-gradient(120deg, hsl(var(--background)), hsl(var(--primary) / 0.2))`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <aside className="relative z-10 hidden border-r border-border/60 bg-card/60 text-foreground shadow-[0_25px_80px_hsl(var(--background)_/_0.7)] backdrop-blur-2xl md:block">
          <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        </aside>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col border-l border-border/40 bg-card/90 text-foreground shadow-[0_25px_80px_hsl(var(--background)_/_0.75)] backdrop-blur-2xl">
          <Topbar onMenuClick={openMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-10">{children}</main>
        </div>
      </div>

      <div
        className={[
          'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        aria-hidden
        onClick={closeMobileSidebar}
      />

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] border-r border-border/60 bg-card/95 text-foreground shadow-2xl backdrop-blur md:hidden',
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
        />
      </div>
    </div>
  );
}
