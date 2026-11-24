import { z } from "zod";
import type { RecipeFormValues } from "./recipe-form-conversion.ts";

// Imported recipes the user has not saved yet, kept per account in localStorage until each is saved,
// resolved to a recipe already in the library, or explicitly discarded. Edits are written as they happen,
// so a reload or a closed editor does not lose them. Keyed by user id: another account in the same
// browser never sees them. Up to MAX_DRAFTS wait side by side, so a new import does not replace a kept one.
export type ImportDraft = {
  /** The editor's draft-import-… id. */
  id: string;
  values: RecipeFormValues & { suggestedCollection?: string };
  source: "extension" | null;
  /** The editor was open when last written; a reload reopens it. */
  open: boolean;
  savedAt: number;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const KEY_PREFIX = "keep-and-cook:import-drafts:";
export const IMPORT_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFTS = 10;
// Written by extension/library-handoff.js: a copy of the last extension import kept across sign-in.
export const EXTENSION_RECOVERY_STORAGE_KEY = "keep-and-cook:extension-auth-recovery";

// Loose on purpose: a draft holds what the user is still typing (a half-written link, an empty title),
// which the save schema would reject. Only shape and size are checked here; saving validates fully.
const text = (max: number) => z.string().max(max).optional();
const draftSchema = z.object({
  id: z.string().regex(/^draft-import-[\w-]{1,80}$/),
  values: z.object({
    title: z.string().max(1_000),
    description: text(20_000),
    ingredients: z.array(z.object({ id: z.string().max(100), name: z.string().max(1_000), amount: text(200), unit: text(200) })).max(200),
    steps: z.array(z.object({ id: z.string().max(100), text: z.string().max(20_000) })).max(200),
    collectionIds: z.array(z.string().max(100)).max(50),
    tags: z.array(z.string().max(100)).max(50),
    sourceUrl: text(4_000),
    imageUrl: text(4_000_000),
    totalTime: text(200),
    servings: text(200),
    suggestedCollection: text(200),
  }),
  source: z.enum(["extension"]).nullable(),
  open: z.boolean(),
  savedAt: z.number(),
});

const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

function load(storage: DraftStorage, userId: string, now: number): ImportDraft[] {
  let stored: unknown;
  try { stored = JSON.parse(storage.getItem(keyFor(userId)) ?? "[]"); } catch { stored = []; }
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((item) => {
    const parsed = draftSchema.safeParse(item);
    return parsed.success && parsed.data.savedAt <= now && now - parsed.data.savedAt < IMPORT_DRAFT_MAX_AGE_MS ? [parsed.data] : [];
  });
}

function store(storage: DraftStorage, userId: string, drafts: ImportDraft[]) {
  if (drafts.length) storage.setItem(keyFor(userId), JSON.stringify(drafts));
  else storage.removeItem(keyFor(userId));
}

/** Newest first. Expired and unreadable entries are dropped. */
export function readImportDrafts(storage: DraftStorage | undefined, userId: string, now = Date.now()): ImportDraft[] {
  if (!storage || !userId) return [];
  try {
    return load(storage, userId, now).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/** Adds or replaces the draft with this id. Returns false when the browser refused to store it. */
export function writeImportDraft(storage: DraftStorage | undefined, userId: string, draft: ImportDraft): boolean {
  if (!storage || !userId) return false;
  try {
    // Read again before writing so drafts kept in another tab are not overwritten.
    const others = load(storage, userId, draft.savedAt).filter((item) => item.id !== draft.id);
    store(storage, userId, [draft, ...others].slice(0, MAX_DRAFTS));
    return true;
  } catch {
    return false;
  }
}

/** Returns false when the browser refused the change, so the caller does not claim it was removed. */
export function clearImportDraft(storage: DraftStorage | undefined, userId: string, id: string, now = Date.now()): boolean {
  if (!storage || !userId) return false;
  try {
    store(storage, userId, load(storage, userId, now).filter((item) => item.id !== id));
    return true;
  } catch {
    return false;
  }
}
