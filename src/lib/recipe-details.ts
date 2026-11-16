export function getVisibleRecipeDescription(recipe: { title: string; description: string }) {
  const description = recipe.description.trim();
  if (!description) return null;

  const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return normalize(description) === normalize(recipe.title) ? null : description;
}

export function formatServingsLabel(value: string) {
  const trimmed = value.trim();
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed} servings` : value;
}

export function claimFirstCookHint(
  storage: Pick<Storage, "getItem" | "setItem">,
  userId: string,
  existingCount: number,
  hasSteps: boolean,
  isUpdate: boolean,
) {
  if (isUpdate || existingCount !== 0 || !hasSteps) return false;
  const key = `keep-and-cook:first-cook-hint:${userId}`;
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
  } catch {
    // The recipe still opens when browser storage is unavailable.
  }
  return true;
}
