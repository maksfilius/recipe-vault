export function getVisibleRecipeDescription(recipe: { title: string; description: string }) {
  const description = recipe.description.trim();
  if (!description) return null;

  const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return normalize(description) === normalize(recipe.title) ? null : description;
}
