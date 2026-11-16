"use client";

import { ArrowLeft } from "lucide-react";
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
    editingRecipe, isDialogOpen, addRecipeMode, setAddRecipeMode, importUrl, setImportUrl, setImportError,
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
                  ? "Paste a recipe link or write it manually."
                  : "Only a recipe name is required. Add ingredients and steps when you have them."}
            </DialogDescription>
          </DialogHeader>
          {!editingRecipe && addRecipeMode === "select" ? (
            <div>
              <form noValidate className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void handleImportRecipe(); }}>
                <Input type="url" aria-label="Recipe URL" aria-invalid={Boolean(importError)} aria-describedby={importError ? "dialog-import-error" : undefined}
                  value={importUrl} onChange={(event) => { setImportUrl(event.target.value); setImportError(""); }}
                  placeholder="https://example.com/recipe" className="min-w-0 flex-1" />
                <Button type="submit" disabled={isImportingRecipe}>
                  {isImportingRecipe ? "Importing…" : importError ? "Retry" : "Import"}
                </Button>
              </form>
              {isImportingRecipe ? <p className="mt-3 text-sm text-muted-foreground" role="status">Reading the recipe…</p> : null}
              {importError ? <p id="dialog-import-error" className="mt-3 text-sm text-destructive" role="alert">{importError}</p> : null}
              <button type="button" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => setAddRecipeMode("manual")}>or write it manually</button>
            </div>
          ) : addRecipeMode === "manual" ? (
            <>
              {!editingRecipe ? <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setAddRecipeMode("select")}><ArrowLeft aria-hidden />Back to link</Button> : null}
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
