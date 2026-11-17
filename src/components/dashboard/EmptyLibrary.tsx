"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import RecipeForm from "./recipe/RecipeForm";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { RecipeFormValues } from "@/src/lib/recipe-form-conversion";
import { env } from "@/src/lib/env";


export function EmptyLibrary({
  importUrl, setImportUrl, importError, clearImportError, isImporting, isSaving, isOffline,
  onImport, onManualSubmit,
}: {
  importUrl: string;
  setImportUrl: (url: string) => void;
  importError: string;
  clearImportError: () => void;
  isImporting: boolean;
  isSaving: boolean;
  isOffline: boolean;
  onImport: () => Promise<void>;
  onManualSubmit: (values: RecipeFormValues) => Promise<void>;
}) {
  const [manualOpen, setManualOpen] = useState(false);

  if (manualOpen) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card px-4 py-5 sm:px-6 sm:py-6">
        <Button type="button" variant="ghost" size="sm" className="mb-4" onClick={() => setManualOpen(false)}>
          <ArrowLeft aria-hidden="true" />Back to link
        </Button>
        <h1 className="mb-1 font-display text-2xl text-foreground">Write your first recipe</h1>
        <p className="mb-6 text-sm text-muted-foreground">Only a name is required.</p>
        <RecipeForm mode="create" initialSourceUrl={importUrl} isSaving={isSaving} onSubmit={(values) => void onManualSubmit(values)} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl text-foreground">Add your first recipe</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Paste a recipe link, or write one yourself.</p>
      <form noValidate className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void onImport(); }}>
        <Input type="url" aria-label="Recipe URL" aria-invalid={Boolean(importError)} aria-describedby={importError ? "empty-import-error" : undefined}
          value={importUrl} onChange={(event) => { setImportUrl(event.target.value); clearImportError(); }}
          placeholder="https://example.com/recipe" className="min-w-0 flex-1" disabled={isOffline} />
        <Button type="submit" disabled={isImporting || isOffline}>{isImporting ? "Importing…" : importError ? "Retry" : "Import"}</Button>
      </form>
      {isImporting ? <p className="mt-3 text-sm text-muted-foreground" role="status">Reading the recipe…</p> : null}
      {importError ? <p id="empty-import-error" className="mt-3 text-sm text-destructive" role="alert">{importError}</p> : null}
      <button type="button" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
        disabled={isOffline} onClick={() => setManualOpen(true)}>or write it manually</button>
      {env.chromeExtensionUrl ? (
        <div className="mt-8 border-t border-border pt-4">
          <a href={env.chromeExtensionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Install the Chrome extension <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <p className="text-xs text-muted-foreground">Save recipes from any site in one click.</p>
        </div>
      ) : null}
    </section>
  );
}
