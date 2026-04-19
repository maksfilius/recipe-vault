import { useState } from "react";
import { Recipe, RecipeCategory, Ingredient, Step, RECIPE_CATEGORIES } from "../../../types/recipe";
import { Button } from "../../ui/button";

export type RecipeFormValues = Omit<Recipe, "id">;

type RecipeFormProps = {
  mode: "create" | "edit";
  initialValue?: Recipe;
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

const formatAmountInput = (amount?: string) => amount ?? "";

const parseAmountInput = (value: string) => {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

export default function RecipeForm({ mode, initialValue, onSubmit }: RecipeFormProps) {
  const initialIngredients = initialValue?.ingredients?.length
    ? initialValue.ingredients
    : [createEmptyIngredient()];
  const [title, setTitle] = useState(() => initialValue?.title ?? "");
  const [category, setCategory] = useState<RecipeCategory>(
    () => initialValue?.category ?? RECIPE_CATEGORIES[0]
  );
  const [description, setDescription] = useState(
    () => initialValue?.description ?? ""
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => initialIngredients);
  const [ingredientAmountInputs, setIngredientAmountInputs] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialIngredients.map((ingredient) => [
          ingredient.id,
          formatAmountInput(ingredient.amount),
        ]),
      ),
  );

  const [steps, setSteps] = useState<Step[]>(() =>
    initialValue?.steps ?? [createEmptyStep()]
  );
  const [sourceUrl, setSourceUrl] = useState(
    () => initialValue?.sourceUrl ?? ""
  );

  const addIngredient = () => {
    const ingredient = createEmptyIngredient();

    setIngredients(prev => [
      ...prev,
      ingredient,
    ]);
    setIngredientAmountInputs(prev => ({
      ...prev,
      [ingredient.id]: "",
    }));
  };

  const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
    setIngredients(prev =>
      prev.map(ingredient =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient
      )
    );
  };

  const removeIngredient = (id: string) => {
    const fallbackIngredient = createEmptyIngredient();

    setIngredients(prev => {
      const next = prev.filter((ingredient) => ingredient.id !== id);

      if (next.length === 0) {
        return [fallbackIngredient];
      }

      return next;
    });

    setIngredientAmountInputs(prev => {
      const next = { ...prev };
      delete next[id];

      if (Object.keys(next).length === 0) {
        next[fallbackIngredient.id] = "";
      }

      return next;
    });
  };

  const updateIngredientAmount = (id: string, value: string) => {
    setIngredientAmountInputs(prev => ({
      ...prev,
      [id]: value,
    }));

    updateIngredient(id, {
      amount: parseAmountInput(value),
    });
  };


  const addStep = () => {
    setSteps(prev => [
      ...prev,
      createEmptyStep(),
    ]);
  };

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps(prev =>
      prev.map(step => (step.id === id ? { ...step, ...patch } : step))
    );
  };

  const removeStep = (id: string) => {
    setSteps(prev => {
      const next = prev.filter(step => step.id !== id);
      if (next.length === 0) {
        return [createEmptyStep()];
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      category,
      description: description.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      ingredients,
      steps
    });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl space-y-4 pb-1 sm:space-y-6 sm:rounded-2xl sm:border sm:border-border/70 sm:bg-card/80 sm:p-6 sm:shadow-[0_15px_45px_hsl(var(--foreground)_/_0.08)] sm:backdrop-blur"
      >
        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Recipe name</span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
              value={title}
              onChange={event => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Category</span>
            <select
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
              value={category}
              onChange={event =>
                setCategory(event.target.value as RecipeCategory)
              }
            >
              {RECIPE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-foreground">Description</span>
          <textarea
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
            rows={4}
            value={description}
            onChange={event => setDescription(event.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <section className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Ingredients</span>
            <div className="space-y-3 sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/40 sm:p-4 sm:shadow-inner sm:shadow-foreground/5">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="space-y-2.5 rounded-lg border border-border/45 bg-card/40 p-2.5 sm:space-y-3 sm:rounded-xl sm:border-transparent sm:bg-card/60 sm:p-3 sm:shadow-sm sm:ring-1 sm:ring-border/60">
                  <div className="flex items-center justify-end text-xs text-muted-foreground sm:justify-between">
                    <span className="hidden font-semibold text-foreground/80 sm:inline">
                      Ingredient {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-xs"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)]">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium text-muted-foreground sm:text-xs">
                        Name
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/50 bg-background/75 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:border-border/60 sm:bg-background/60 sm:text-sm"
                        value={ingredient.name}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, { name: event.target.value })
                        }
                        required={index === 0}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium text-muted-foreground sm:text-xs">
                        Quantity
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/50 bg-background/75 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:border-border/60 sm:bg-background/60 sm:text-sm"
                        type="text"
                        inputMode="decimal"
                        value={ingredientAmountInputs[ingredient.id] ?? ""}
                        onChange={(event) =>
                          updateIngredientAmount(ingredient.id, event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium text-muted-foreground sm:text-xs">
                        Unit
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/50 bg-background/75 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:border-border/60 sm:bg-background/60 sm:text-sm"
                        value={ingredient.unit ?? ""}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, { unit: event.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center border border-dashed border-border/60 bg-transparent text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border sm:bg-background/60"
                onClick={addIngredient}
              >
                + Add ingredient
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Steps</span>
            <div className="space-y-3 sm:rounded-2xl sm:border sm:border-border/60 sm:bg-background/40 sm:p-4 sm:shadow-inner sm:shadow-foreground/5">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="space-y-2 rounded-lg border border-border/45 bg-card/40 p-2.5 sm:rounded-xl sm:border-transparent sm:bg-card/60 sm:p-3 sm:shadow-sm sm:ring-1 sm:ring-border/60"
                >
                  <div className="flex items-center justify-end text-xs text-muted-foreground sm:justify-between">
                    <span className="hidden font-semibold text-foreground/80 sm:inline">
                      Step {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-xs"
                      onClick={() => removeStep(step.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    className="w-full rounded-lg border border-border/50 bg-background/75 px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:border-border/60 sm:bg-background/60 sm:text-sm"
                    rows={3}
                    value={step.text}
                    onChange={event =>
                      updateStep(step.id, { text: event.target.value })
                    }
                    required={index === 0}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center border border-dashed border-border/60 bg-transparent text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border sm:bg-background/60"
                onClick={addStep}
              >
                + Add step
              </Button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <section className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">
              Source link
            </span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-base text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm"
              value={sourceUrl}
              onChange={event => setSourceUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — link to the original source or blog post.
            </p>
          </section>

        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="submit" size="md" className="px-5">
            {mode === "edit" ? "Update recipe" : "Save recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
