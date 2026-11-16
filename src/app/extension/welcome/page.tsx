import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export const metadata: Metadata = {
  title: "Welcome to the Keep & Cook extension",
  description: "Open a recipe page, click the Keep & Cook icon, and cook from a clean recipe.",
};

// A recipe that the benchmark reads completely, so the first try works.
const SAMPLE_RECIPE_URL = "https://www.thekitchn.com/roast-chicken-recipe-23847070";

const steps = [
  ["Pin the icon", "Open the puzzle-piece menu in the Chrome toolbar and pin Keep & Cook."],
  ["Open a recipe page", "Any recipe website works. Try the sample below."],
  ["Click the icon", "A side panel shows the ingredients and steps. Start cooking, download, or save to your library."],
] as const;

export default function ExtensionWelcomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/" className="text-xl font-semibold tracking-tight">Keep &amp; Cook</Link>
      <h1 className="mt-12 text-3xl font-bold tracking-tight">The extension is ready</h1>
      <ol className="mt-8 space-y-6">
        {steps.map(([title, text], index) => (
          <li key={title} className="flex gap-4">
            <span aria-hidden="true" className="font-semibold text-primary">{index + 1}</span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted-foreground">
        Keep &amp; Cook reads a page only when you click its icon on that page. No account is needed to read, cook or download.
      </p>
      <Button asChild className="mt-8">
        <a href={SAMPLE_RECIPE_URL} target="_blank" rel="noreferrer">Open a recipe site</a>
      </Button>
    </main>
  );
}
