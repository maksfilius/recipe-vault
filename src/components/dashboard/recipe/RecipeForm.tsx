"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { Recipe } from "../../../types/recipe";
import { Button } from "../../ui/button";
import {
  buildRecipeFormValues,
  ingredientsToText,
  stepsToText,
  type RecipeFormValues,
} from "@/src/lib/recipe-form-conversion";

export type RecipeFormInitialValue = Recipe & { suggestedCollection?: string };

type RecipeFormProps = {
  mode: "create" | "edit";
  initialValue?: RecipeFormInitialValue;
  initialSourceUrl?: string;
  isSaving?: boolean;
  onSubmit: (values: RecipeFormValues) => void;
};

const fieldClass = "w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground";

export default function RecipeForm({ mode, initialValue, initialSourceUrl, isSaving = false, onSubmit }: RecipeFormProps) {
  const [title, setTitle] = useState(() => initialValue?.title ?? "");
  const [ingredients, setIngredients] = useState(() => toRows(ingredientsToText(initialValue?.ingredients ?? [])));
  const [steps, setSteps] = useState(() => toRows(stepsToText(initialValue?.steps ?? [])));
  const [sourceUrl, setSourceUrl] = useState(() => initialValue?.sourceUrl ?? initialSourceUrl ?? "");
  const [totalTime, setTotalTime] = useState(() => initialValue?.totalTime ?? "");
  const [servings, setServings] = useState(() => initialValue?.servings ?? "");
  const [description, setDescription] = useState(() => initialValue?.description ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(buildRecipeFormValues({
      title,
      ingredientText: ingredients.map((row) => row.value).join("\n"),
      // A step may contain line breaks typed in its box; keep it one step.
      stepText: steps.map((step) => step.value.replace(/\s*\n\s*/g, " ")).join("\n"),
      sourceUrl, totalTime, servings, description, initialValue,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-5 pb-1">
      <label className="block space-y-2">
        <span className="block text-sm font-semibold text-foreground">Recipe name</span>
        <input name="title" className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} autoFocus />
      </label>

      <ListField label="Ingredients" itemLabel="Ingredient" addLabel="Add ingredient" placeholder="200 g flour" rows={ingredients} onChange={setIngredients} />
      <ListField label="Steps" itemLabel="Step" addLabel="Add step" placeholder="Describe this step" rows={steps} onChange={setSteps} multiline />

      <details className="group rounded-xl border border-border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          More details <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
          <label className="block space-y-2">
            <span className="block text-sm font-semibold text-foreground">Source link</span>
            <input name="sourceUrl" className={fieldClass} type="url" inputMode="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/recipe" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-foreground">Total time</span>
              <input name="totalTime" className={fieldClass} value={totalTime} onChange={(event) => setTotalTime(event.target.value)} placeholder="45 min" maxLength={80} />
            </label>
            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-foreground">Servings</span>
              <input name="servings" className={fieldClass} value={servings} onChange={(event) => setServings(event.target.value)} placeholder="4 servings" maxLength={80} />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="block text-sm font-semibold text-foreground">Description</span>
            <textarea name="description" className={fieldClass} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
      </details>

      <div className="-mx-4 -mb-1 flex justify-end border-t border-border bg-card px-4 py-3 sm:-mx-6 sm:px-6">
        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
          {isSaving ? "Saving…" : mode === "edit" ? "Update recipe" : "Save recipe"}
        </Button>
      </div>
    </form>
  );
}

type Row = { id: string; value: string };

const newRow = (value = ""): Row => ({ id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2), value });

function toRows(text: string): Row[] {
  const rows = text.split("\n").filter((row) => row.trim()).map((value) => newRow(value));
  return rows.length ? rows : [newRow()];
}

type ListFieldProps = {
  label: string;
  itemLabel: string;
  addLabel: string;
  placeholder: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  multiline?: boolean;
};

// One box per ingredient or step. Enter in an ingredient adds the next row;
// pasting several lines splits them into rows.
function ListField({ label, itemLabel, addLabel, placeholder, rows, onChange, multiline = false }: ListFieldProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    listRef.current?.querySelectorAll<HTMLElement>("input, textarea")[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  }, [rows]);
  const focusRow = (index: number) => { pendingFocus.current = index; };
  const update = (index: number, value: string) => onChange(rows.map((row, i) => (i === index ? { ...row, value } : row)));
  const insertAfter = (index: number) => {
    onChange([...rows.slice(0, index + 1), newRow(), ...rows.slice(index + 1)]);
    focusRow(index + 1);
  };
  const remove = (index: number) => {
    onChange(rows.length === 1 ? [newRow()] : rows.filter((_, i) => i !== index));
    focusRow(Math.max(0, index - 1));
  };
  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !multiline && !event.nativeEvent.isComposing) {
      event.preventDefault();
      insertAfter(index);
    }
    if (event.key === "Backspace" && !rows[index].value && rows.length > 1) {
      event.preventDefault();
      remove(index);
    }
  };
  const onPaste = (index: number) => (event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const lines = event.clipboardData.getData("text").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return;
    event.preventDefault();
    const [first, ...rest] = lines;
    const current = rows[index].value;
    const merged = [...rows.slice(0, index), { ...rows[index], value: current ? `${current} ${first}` : first }, ...rest.map((line) => newRow(line)), ...rows.slice(index + 1)];
    onChange(merged);
    focusRow(index + rest.length);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 block text-sm font-semibold text-foreground">{label}</legend>
      <ol ref={listRef} className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="flex items-start gap-2">
            <span className="mt-3 w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground" aria-hidden="true">{index + 1}</span>
            {multiline ? (
              <textarea aria-label={`${itemLabel} ${index + 1}`} className={fieldClass} rows={2} value={row.value} placeholder={placeholder}
                onChange={(event) => update(index, event.target.value)} onKeyDown={onKeyDown(index)} onPaste={onPaste(index)} />
            ) : (
              <input aria-label={`${itemLabel} ${index + 1}`} className={fieldClass} value={row.value} placeholder={placeholder}
                onChange={(event) => update(index, event.target.value)} onKeyDown={onKeyDown(index)} onPaste={onPaste(index)} />
            )}
            <button type="button" aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`} onClick={() => remove(index)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => insertAfter(rows.length - 1)}
        className="ml-8 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-muted">
        <Plus className="size-4" aria-hidden="true" />{addLabel}
      </button>
    </fieldset>
  );
}
