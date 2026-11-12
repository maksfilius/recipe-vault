import Link from "next/link";
import { env } from "@/src/lib/env";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
        <div>
          <p className="font-display text-2xl text-foreground">Keep &amp; Cook</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">A clear place for the recipes you actually cook.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Explore</p>
          <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
            <a href="#try-it" className="w-fit hover:text-foreground hover:underline">Try a recipe link</a>
            <a href="#extension" className="w-fit hover:text-foreground hover:underline">Chrome extension</a>
            <Link href="/login" className="w-fit hover:text-foreground hover:underline">Sign in</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">About</p>
          <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="/privacy" className="w-fit hover:text-foreground hover:underline">Privacy</Link>
            <Link href="/terms" className="w-fit hover:text-foreground hover:underline">Terms</Link>
            {env.supportEmail && <a href={`mailto:${env.supportEmail}`} className="w-fit break-all hover:text-foreground hover:underline">Contact</a>}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-border pt-5 text-xs text-muted-foreground">© {new Date().getFullYear()} Keep &amp; Cook</div>
    </footer>
  );
}
