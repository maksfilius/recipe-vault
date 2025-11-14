'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './SideBar';
import Topbar from './TopBar';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('sidebar:collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <div
      className="relative grid min-h-[100dvh] overflow-hidden bg-slate-950 text-white before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.25),transparent_55%)] before:opacity-70 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-slate-950/40 after:content-['']"
      style={{
        gridTemplateColumns: `${collapsed ? '4rem' : '12rem'} 1fr`,
        backgroundImage: `linear-gradient(120deg, rgba(58,21,112,0.9), rgba(10,62,110,0.85))`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <aside className="relative z-10 border-r border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(2,6,23,0.45)]">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      </aside>

      <div className="relative z-10 flex min-w-0 flex-col border-white/10 bg-white/90 text-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.4)] backdrop-blur-2xl">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
