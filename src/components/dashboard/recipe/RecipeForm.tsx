import { useMemo, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";

import type {
  Ingredient,
  Recipe,
  RecipeCollection,
  Step,
} from "../../../types/recipe";
import { Button } from "../../ui/button";

export type RecipeFormValues = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  collectionIds: string[];
  tags: string[];
  sourceUrl?: string;
  imageUrl?: string;
  totalTime?: string;
  servings?: string;
};

export type RecipeFormInitialValue = Recipe & {
  suggestedCollection?: string;
};

type RecipeFormProps = {
  mode: "create" | "edit";
  initialValue?: RecipeFormInitialValue;
  collections: RecipeCollection[];
  onCreateCollection: (name: string) => Promise<RecipeCollection | null>;
  onSubmit: (values: RecipeFormValues) => void;
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyIngredient = (): Ingredient => ({
  id: createId(),
  name: "",
  amount: undefined,
  unit: "",
});

const createEmptyStep = (): Step => ({
  id: createId(),
  text: "",
});

function normalizeTags(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[,;\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const normalized = tag.toLocaleLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

export default function RecipeForm({
  mode,
  initialValue,
  collections,
  onCreateCollection,
  onSubmit,
}: RecipeFormProps) {
  const initialIngredients = initialValue?.ingredients?.length
    ? initialValue.ingredients
    : [createEmptyIngredient()];
  const [title, setTitle] = useState(() => initialValue?.title ?? "");
  const [description, setDescription] = useState(() => initialValue?.description ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => initialIngredients);
  const [ingredientAmountInputs, setIngredientAmountInputs] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialIngredients.map((ingredient) => [ingredient.id, ingredient.amount ?? ""]),
      ),
  );
  const [steps, setSteps] = useState<Step[]>(() => initialValue?.steps ?? []);
  const [sourceUrl, setSourceUrl] = useState(() => initialValue?.sourceUrl ?? "");
  const [imageUrl, setImageUrl] = useState(() => initialValue?.imageUrl);
  const [totalTime, setTotalTime] = useState(() => initialValue?.totalTime ?? "");
  const [servings, setServings] = useState(() => initialValue?.servings ?? "");
  const [tagsInput, setTagsInput] = useState(() => initialValue?.tags.join(", ") ?? "");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(() => {
    const initialIds = initialValue?.collections.map((collection) => collection.id) ?? [];
    if (initialIds.length > 0 || !initialValue?.suggestedCollection) return initialIds;

    const suggestedName = initialValue.suggestedCollection.toLocaleLowerCase();
    const match = collections.find(
      (collection) => collection.name.toLocaleLowerCase() === suggestedName,
    );
    return match ? [match.id] : [];
  });
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const suggestedCollection = initialValue?.suggestedCollection?.trim();
  const matchingSuggestedCollection = useMemo(
    () =>
      suggestedCollection
        ? collections.find(
            (collection) =>
              collection.name.toLocaleLowerCase() === suggestedCollection.toLocaleLowerCase(),
          )
        : undefined,
    [collections, suggestedCollection],
  );

  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId],
    );
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;

    setIsCreatingCollection(true);
    setCollectionError("");
    const collection = await onCreateCollection(name);
    setIsCreatingCollection(false);

    if (!collection) {
      setCollectionError("Could not create this collection. It may already exist.");
      return;
    }

    setSelectedCollectionIds((current) => [...new Set([...current, collection.id])]);
    setNewCollectionName("");
  };

  const addIngredient = () => {
    const ingredient = createEmptyIngredient();
    setIngredients((current) => [...current, ingredient]);
    setIngredientAmountInputs((current) => ({ ...current, [ingredient.id]: "" }));
  };

  const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient,
      ),
    );
  };

  const removeIngredient = (id: string) => {
    const fallbackIngredient = createEmptyIngredient();
    setIngredients((current) => {
      const next = current.filter((ingredient) => ingredient.id !== id);
      return next.length > 0 ? next : [fallbackIngredient];
    });
    setIngredientAmountInputs((current) => {
      const next = { ...current };
      delete next[id];
      if (Object.keys(next).length === 0) next[fallbackIngredient.id] = "";
      return next;
    });
  };

  const addStep = () => setSteps((current) => [...current, createEmptyStep()]);
  const removeStep = (id: string) =>
    setSteps((current) => current.filter((step) => step.id !== id));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients.filter(
        (ingredient) =>
          ingredient.name.trim() ||
          ingredient.amount !== undefined ||
          (ingredient.unit ?? "").trim(),
      ),
      steps: steps.filter((step) => step.text.trim()),
      collectionIds: selectedCollectionIds,
      tags: normalizeTags(tagsInput),
      sourceUrl: sourceUrl.trim() || undefined,
      imageUrl,
      totalTime: totalTime.trim() || undefined,
      servings: servings.trim() || undefined,
    });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6 pb-1">
        {imageUrl ? (
          <div className="relative h-40 overflow-hidden rounded-2xl border border-border/70 bg-muted/55">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="absolute right-3 top-3 border border-border/70 bg-card/90"
              onClick={() => setImageUrl(undefined)}
            >
              <X aria-hidden="true" /> Remove image
            </Button>
          </div>
        ) : (
          <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-border/70 bg-muted/35 text-muted-foreground">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Recipe name</span>
          <input
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <section className="space-y-3">
          <div>
            <span className="block text-sm font-semibold text-foreground">Collections</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Use collections for broad groups. A recipe can belong to more than one.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => {
              const selected = selectedCollectionIds.includes(collection.id);
              return (
                <button
                  key={collection.id}
                  type="button"
                  aria-pressed={selected}
                  className={[
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-card/70 text-foreground hover:border-primary/45",
                  ].join(" ")}
                  onClick={() => toggleCollection(collection.id)}
                >
                  {collection.name}
                </button>
              );
            })}
          </div>
          {suggestedCollection && !matchingSuggestedCollection ? (
            <p className="text-xs text-muted-foreground">
              Import suggestion: <span className="font-semibold text-foreground">{suggestedCollection}</span>.
              Create it below if it is useful to you.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
              value={newCollectionName}
              onChange={(event) => {
                setNewCollectionName(event.target.value);
                setCollectionError("");
              }}
              placeholder={suggestedCollection ?? "New collection"}
              maxLength={80}
            />
            <Button
              type="button"
              variant="ghost"
              className="border border-border/70"
              disabled={isCreatingCollection || !newCollectionName.trim()}
              onClick={() => void handleCreateCollection()}
            >
              <Plus aria-hidden="true" />
              {isCreatingCollection ? "Creating..." : "Create"}
            </Button>
          </div>
          {collectionError ? <p className="text-xs text-red-400">{collectionError}</p> : null}
        </section>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Description</span>
          <textarea
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Total time</span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
              value={totalTime}
              onChange={(event) => setTotalTime(event.target.value)}
              placeholder="45 min"
              maxLength={80}
            />
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Servings</span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              placeholder="4 servings"
              maxLength={80}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Tags</span>
          <input
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="quick, vegetarian, pasta"
          />
          <p className="text-xs text-muted-foreground">Separate free-form tags with commas.</p>
        </label>

        <section className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Ingredients</span>
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/88 p-3">
            {ingredients.map((ingredient, index) => (
              <div key={ingredient.id} className="border-t border-border/60 pt-3 first:border-0 first:pt-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Ingredient {index + 1}</span>
                  <button
                    type="button"
                    className="rounded text-muted-foreground hover:text-red-400"
                    aria-label={`Remove ingredient ${index + 1}`}
                    onClick={() => removeIngredient(ingredient.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,.7fr)_minmax(0,.9fr)]">
                  <input
                    className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
                    value={ingredient.name}
                    onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value })}
                    placeholder="Ingredient"
                    required={index === 0}
                  />
                  <input
                    className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
                    value={ingredientAmountInputs[ingredient.id] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setIngredientAmountInputs((current) => ({ ...current, [ingredient.id]: value }));
                      updateIngredient(ingredient.id, { amount: value.trim() || undefined });
                    }}
                    placeholder="Amount"
                    inputMode="decimal"
                  />
                  <input
                    className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
                    value={ingredient.unit ?? ""}
                    onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value })}
                    placeholder="Unit"
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="w-full border border-dashed" onClick={addIngredient}>
              <Plus aria-hidden="true" /> Add ingredient
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Steps</span>
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/88 p-3">
            {steps.map((step, index) => (
              <div key={step.id} className="border-t border-border/60 pt-3 first:border-0 first:pt-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Step {index + 1}</span>
                  <button
                    type="button"
                    className="rounded text-muted-foreground hover:text-red-400"
                    aria-label={`Remove step ${index + 1}`}
                    onClick={() => removeStep(step.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
                  rows={3}
                  value={step.text}
                  onChange={(event) =>
                    setSteps((current) =>
                      current.map((item) =>
                        item.id === step.id ? { ...item, text: event.target.value } : item,
                      ),
                    )
                  }
                  required={index === 0}
                />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="w-full border border-dashed" onClick={addStep}>
              <Plus aria-hidden="true" /> Add step
            </Button>
          </div>
        </section>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Source link</span>
          <input
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-sm"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            inputMode="url"
            placeholder="https://example.com/recipe"
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit" size="md" className="px-5">
            {mode === "edit" ? "Update recipe" : "Save recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
