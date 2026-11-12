"use client";

import { ArrowLeft, Link2, Pencil } from "lucide-react";
import RecipeForm from "./recipe/RecipeForm";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { isDraftImportedRecipe } from "./useDashboardImport";
import { getImportReviewWarnings } from "@/src/lib/recipe-import-review";
import type { useDashboardActions } from "./useDashboardActions";

export function DashboardDialogs({ actions }: {
  actions: ReturnType<typeof useDashboardActions>;
}) {
  const {
    editingRecipe, isDialogOpen, addRecipeMode, setAddRecipeMode, importUrl, setImportUrl,
    isImportingRecipe, importError, isSavingRecipe, handleImportRecipe, handleFormSubmit,
    handleDialogOpenChange,
    recipeToDelete, setRecipeToDelete, handleDeleteRecipe,
  } = actions;
  return <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={addRecipeMode === "manual" ? "sm:max-w-3xl" : "sm:max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>
              {editingRecipe
                ? isDraftImportedRecipe(editingRecipe) ? "Review imported recipe" : "Edit recipe"
                : "Add recipe"}
            </DialogTitle>
            <DialogDescription>
              {editingRecipe
                ? isDraftImportedRecipe(editingRecipe)
                  ? "Check the imported details, fill any gaps, then save."
                  : "Update the details you want to change."
                : addRecipeMode === "select"
                  ? "Start with a recipe link or write your own."
                  : "Only a recipe name is required. Add ingredients and steps when you have them."}
            </DialogDescription>
          </DialogHeader>
          {!editingRecipe && addRecipeMode === "select" ? (
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" aria-hidden /><h3 className="text-base font-semibold">Import from a link</h3></div>
                <p className="mt-2 text-sm text-muted-foreground">We&apos;ll bring the recipe into an editable draft for you to review.</p>
                <form noValidate className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void handleImportRecipe(); }}>
                  <Input type="url" aria-label="Recipe URL" value={importUrl} onChange={(event) => setImportUrl(event.target.value)} placeholder="https://example.com/recipe" className="min-w-0 flex-1" />
                  <Button type="submit" disabled={isImportingRecipe}>
                    {isImportingRecipe ? "Importing…" : importError ? "Try import again" : "Import recipe"}
                  </Button>
                </form>
                {isImportingRecipe ? <p className="mt-3 text-sm text-muted-foreground" role="status">Reading the page and preparing your draft…</p> : null}
                {importError ? <p className="mt-3 text-sm text-destructive" role="alert">{importError} You can retry or add it manually with the link kept in the form.</p> : null}
              </div>
              <button type="button" className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted" onClick={() => setAddRecipeMode("manual")}>
                <Pencil className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span><span className="block text-sm font-semibold">Add manually</span><span className="mt-1 block text-sm text-muted-foreground">Write a recipe from scratch.</span></span>
              </button>
            </div>
          ) : addRecipeMode === "manual" ? (
            <>
              {!editingRecipe ? <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setAddRecipeMode("select")}><ArrowLeft aria-hidden />Back to options</Button> : null}
              {editingRecipe && isDraftImportedRecipe(editingRecipe) && getImportReviewWarnings(editingRecipe).length > 0 ? (
                <div className="rounded-xl border border-border bg-muted p-4 text-sm" role="status">
                  <p className="font-semibold">Check these details before saving</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {getImportReviewWarnings(editingRecipe).map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              ) : null}
              <RecipeForm
                key={editingRecipe?.id ?? "new"}
                mode={editingRecipe && !isDraftImportedRecipe(editingRecipe) ? "edit" : "create"}
                initialValue={editingRecipe ?? undefined}
                initialSourceUrl={!editingRecipe ? importUrl : undefined}
                isSaving={isSavingRecipe}
                onSubmit={(values) => void handleFormSubmit(values)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(recipeToDelete)} onOpenChange={(open) => !open && setRecipeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete recipe?</DialogTitle><DialogDescription>This permanently deletes {recipeToDelete?.title ?? "this recipe"}.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setRecipeToDelete(null)}>Cancel</Button><Button variant="destructive" onClick={() => void handleDeleteRecipe()}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

  </>;
}
