import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-primary">Keep &amp; Cook</Link>
        </div>
      </header>
      <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-20 lg:py-16">
        <div className="hidden max-w-xl lg:block">
          <p className="text-5xl leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Your recipes, ready when you are.</p>
          <p className="mt-6 max-w-md text-lg leading-7 text-muted-foreground">Keep the recipes you love in one calm place, from the first link to the next meal.</p>
        </div>
        <div className="flex min-w-0 justify-center lg:justify-end">{children}</div>
      </main>
    </div>
  );
}
