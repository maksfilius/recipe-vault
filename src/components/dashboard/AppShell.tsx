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
    <div className="relative min-h-[100dvh] overflow-hidden bg-slate-950 text-white before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.25),transparent_55%)] before:opacity-70 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-slate-950/40 after:content-['']">
      <div
        className="relative mx-auto flex min-h-[100dvh] w-full flex-col md:grid"
        style={{
          gridTemplateColumns: `${collapsed ? '4rem' : '12rem'} 1fr`,
          backgroundImage: `linear-gradient(120deg, rgba(58,21,112,0.9), rgba(10,62,110,0.85))`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <aside className="relative z-10 hidden border-r border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(2,6,23,0.45)] md:block">
          <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        </aside>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col border-white/10 bg-white/95 text-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.4)] backdrop-blur-2xl">
          <Topbar onMenuClick={openMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-10">{children}</main>
        </div>
      </div>

      <div
        className={[
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        aria-hidden
        onClick={closeMobileSidebar}
      />

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] border-r border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur md:hidden',
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
