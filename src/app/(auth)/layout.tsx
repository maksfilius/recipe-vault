import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center">
          <Link
            href="/"
            className="pointer-events-auto text-sm font-semibold tracking-[0.18em] text-foreground/90 uppercase transition-colors hover:text-foreground"
          >
            Recipe Vault
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
