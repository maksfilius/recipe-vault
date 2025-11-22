'use client';

import { Menu } from 'lucide-react';

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 shadow-[0_10px_35px_hsl(var(--background)_/_0.6)] backdrop-blur-md">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-foreground shadow-sm transition hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="leading-tight text-foreground">
          <p className="text-lg font-semibold sm:text-2xl">Hi there! Ready to cook?</p>
          <span className="text-sm text-muted-foreground">Let&apos;s organize dinner plans with style</span>
        </div>
      </div>
    </header>
  );
}
