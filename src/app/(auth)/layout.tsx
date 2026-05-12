import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary)_/_0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)_/_0.45))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center">
          <Link
            href="/"
            className="pointer-events-auto text-sm font-semibold tracking-[0.18em] text-foreground/90 uppercase transition-colors hover:text-foreground"
          >
            Keep &amp; Cook
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
