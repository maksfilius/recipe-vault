import { recipePayloadSchema, type RecipePayload } from "./recipe-validation.ts";

const PREFIX = "keep-and-cook:extension-draft:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function draftKey(id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Invalid recipe transfer ID.");
  return `${PREFIX}${id}`;
}

export function storeRecipeTransfer(storage: DraftStorage, id: string, recipe: RecipePayload, now = Date.now()) {
  storage.setItem(draftKey(id), JSON.stringify({ createdAt: now, recipe: recipePayloadSchema.parse(recipe) }));
}

export function readRecipeTransfer(storage: DraftStorage, id: string, now = Date.now()) {
  const key = draftKey(id);
  const raw = storage.getItem(key);
  if (!raw) throw new Error("Recipe transfer not found. Return to the extension and save again.");
  const parsed = JSON.parse(raw) as { createdAt?: number; recipe?: unknown };
  if (typeof parsed.createdAt !== "number" || !Number.isFinite(parsed.createdAt) || now - parsed.createdAt > MAX_AGE_MS || parsed.createdAt > now) {
    storage.removeItem(key);
    throw new Error("Recipe transfer expired. Return to the extension and save again.");
  }
  return recipePayloadSchema.parse(parsed.recipe);
}

export function removeRecipeTransfer(storage: DraftStorage, id: string) {
  storage.removeItem(draftKey(id));
}

export function getImportAuthDestination(next: string | null | undefined) {
  if (!next || next.length > 4_096 || !next.startsWith("/") || next.startsWith("//") || next.includes("#")) return "/dashboard";
  try {
    // Any base works: it only resolves the relative path, and the origin check rejects paths that escape it.
    const base = "https://app.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return "/dashboard";
    if (url.pathname === "/dashboard/favorites") return "/dashboard";
    if (url.pathname === "/dashboard/settings") return url.search ? "/dashboard" : url.pathname;
    if (url.pathname !== "/dashboard") return "/dashboard";
    const allowedParams = new Set(["q", "collections", "tags", "importDraft", "add", "url"]);
    if ([...url.searchParams.keys()].some((key) => !allowedParams.has(key) || url.searchParams.getAll(key).length > 1)) return "/dashboard";
    if (url.searchParams.has("add") && !["manual", "select"].includes(url.searchParams.get("add") ?? "")) return "/dashboard";
    const id = url.searchParams.get("importDraft");
    if (id !== null) draftKey(id);
    return `${url.pathname}${url.search}`;
  } catch { return "/dashboard"; }
}
