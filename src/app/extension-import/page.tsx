"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recipePayloadSchema, type RecipePayload } from "@/src/lib/recipe-validation";
import { storeRecipeTransfer } from "@/src/lib/recipe-import-transfer";
import { supabase } from "@/src/lib/supabase-client";

export default function ExtensionImportPage() {
  const [recipe, setRecipe] = useState<RecipePayload | null>(null);
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("");
  const hasReadTransfer = useRef(false);

  useEffect(() => {
    if (hasReadTransfer.current) return;
    hasReadTransfer.current = true;
    try {
      const raw = window.location.hash.slice(1);
      if (!raw || raw.length > 180000) throw new Error("Invalid transfer.");
      const parsed = recipePayloadSchema.parse(JSON.parse(decodeURIComponent(raw)));
      if (!parsed.ingredients.length || !parsed.steps.length || !parsed.sourceUrl) throw new Error("Incomplete recipe.");
      const id = crypto.randomUUID();
      storeRecipeTransfer(window.localStorage, id, parsed);
      const next = `/dashboard?importDraft=${id}`;
      setDestination(next);
      setRecipe(parsed);
      window.history.replaceState(null, "", window.location.pathname);
      void supabase.auth.getUser().then(({ data: { user } }) => {
        window.location.replace(user ? next : `/login?next=${encodeURIComponent(next)}`);
      }).catch(() => {
        setError("Could not check your account. Sign in below to continue with your recipe.");
      });
    } catch {
      setError("Could not keep this recipe for import. Allow site storage, then choose Save to library in the extension again.");
    }
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/" className="text-xl font-semibold tracking-tight">Keep &amp; Cook</Link>
      <h1 className="mt-12 text-3xl font-bold tracking-tight">Bring this recipe into your cookbook</h1>
      {error ? <p role="alert" className="mt-6 text-destructive">{error}</p> : null}
      {!recipe && !error ? <p role="status" className="mt-6">Reading your recipe…</p> : null}
      {recipe ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">{recipe.title}</h2>
          <p className="mt-3 text-muted-foreground">{recipe.description}</p>
          <p className="mt-4">{recipe.ingredients.length} ingredients · {recipe.steps.length} steps</p>
          <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-primary underline underline-offset-4">View original recipe</a>
          <p role="status" className="mt-8">Opening your recipe editor. Sign in or create an account if needed.</p>
          {destination ? <Link href={`/login?next=${encodeURIComponent(destination)}`} className="mt-4 inline-block text-primary underline underline-offset-4">Continue to sign in</Link> : null}
          <p className="mt-3 text-sm text-muted-foreground">Your draft stays in this browser for up to 7 days, including while you confirm your email. Review or edit it, then choose Save to add it to your library.</p>
        </section>
      ) : null}
    </main>
  );
}
