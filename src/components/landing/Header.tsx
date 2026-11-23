"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import BrandMark from "@/src/components/BrandMark";
import ThemeToggle from "@/src/components/ThemeToggle";
import { Button } from "@/src/components/ui/button";

const links = [
  { href: "/chrome-extension", label: "Chrome extension" },
  { href: "/install", label: "On your phone" },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card">
      <nav className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-5 px-5 sm:px-8" aria-label="Main navigation">
        <Link href="/" className="inline-flex min-h-11 items-center gap-3 font-display text-xl font-semibold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true"><BrandMark className="size-6" /></span>
          Keep &amp; Cook
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              className="font-medium text-foreground underline-offset-4 hover:underline aria-[current=page]:text-primary aria-[current=page]:underline">{label}</Link>
          ))}
          <ThemeToggle />
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
          <Button asChild size="sm"><Link href="/register">Create account</Link></Button>
        </div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border text-foreground md:hidden">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="border-t border-border bg-card px-5 pb-5 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}
                className="flex min-h-11 items-center text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-primary">{label}</Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-foreground">Sign in</Link>
            <Button asChild className="mt-2"><Link href="/register" onClick={() => setOpen(false)}>Create account</Link></Button>
            <div className="mt-2"><ThemeToggle /></div>
          </div>
        </nav>
      )}
    </header>
  );
}
