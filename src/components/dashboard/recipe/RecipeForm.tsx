import { useState } from "react";
import { Recipe, RecipeCategory, Ingredient, Step } from "../../../types/recipe";
import { Button } from "../../ui/button";

export type RecipeFormValues = Omit<Recipe, "id">;

type RecipeFormProps = {
  mode: "create" | "edit";
  initialValue?: Recipe;
  onSubmit: (values: RecipeFormValues) => void;
};

const createEmptyIngredient = (): Ingredient => ({
  id: crypto.randomUUID(),
  name: "",
  amount: undefined,
  unit: "",
});

const createEmptyStep = (): Step => ({
  id: crypto.randomUUID(),
  text: "",
});

const categories: RecipeCategory[] = ["breakfast", "snack", "lunch", "dinner"];

export default function RecipeForm({ mode, initialValue, onSubmit }: RecipeFormProps) {
  const [title, setTitle] = useState(() => initialValue?.title ?? "");
  const [category, setCategory] = useState<RecipeCategory>(
    () => initialValue?.category ?? categories[0]
  );
  const [description, setDescription] = useState(
    () => initialValue?.description ?? ""
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(() =>
    initialValue?.ingredients ?? [createEmptyIngredient()]
  );

  const [steps, setSteps] = useState<Step[]>(() =>
    initialValue?.steps ?? [createEmptyStep()]
  );
  const [sourceUrl, setSourceUrl] = useState(
    () => initialValue?.sourceUrl ?? ""
  );
  const [image, setImage] = useState<string>(
    () => initialValue?.image ?? ""
  );

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      createEmptyIngredient(),
    ]);
  };

  const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
    setIngredients(prev =>
      prev.map(ingredient =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient
      )
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => {
      const next = prev.filter((ingredient) => ingredient.id !== id);

      if (next.length === 0) {
        return [createEmptyIngredient()];
      }

      return next;
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
      image: image || undefined,
      ingredients,
      steps
    });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl space-y-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_15px_45px_hsl(var(--foreground)_/_0.08)] backdrop-blur"
      >
        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Recipe name</span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              value={title}
              onChange={event => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Category</span>
            <select
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              value={category}
              onChange={event =>
                setCategory(event.target.value as RecipeCategory)
              }
            >
              {categories.map(category => (
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
            className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            rows={4}
            value={description}
            onChange={event => setDescription(event.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-6">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Ingredients</span>
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-inner shadow-foreground/5">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="space-y-3 rounded-xl bg-card/60 p-3 shadow-sm ring-1 ring-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      Ingredient {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)]">
                    <div className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Name
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={ingredient.name}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, { name: event.target.value })
                        }
                        required={index === 0}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Qty
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        type="number"
                        value={ingredient.amount ?? ""}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            amount: event.target.value ? Number(event.target.value) : undefined,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Unit
                      </span>
                      <input
                        className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                className="w-full justify-center border border-dashed border-border/70 bg-background/60 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border"
                onClick={addIngredient}
              >
                + Add ingredient
              </Button>
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">Steps</span>
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4 shadow-inner shadow-foreground/5">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="space-y-2 rounded-xl bg-card/60 p-3 shadow-sm ring-1 ring-border/60"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      Step {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => removeStep(step.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                className="w-full justify-center border border-dashed border-border/70 bg-background/60 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-border"
                onClick={addStep}
              >
                + Add step
              </Button>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">
              Image (optional)
            </span>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
              <input
                type="file"
                accept="image/*"
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    const objectUrl = URL.createObjectURL(file);
                    setImage(objectUrl);
                  } else {
                    setImage("");
                  }
                }}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border/70 file:bg-muted file:px-3 file:py-2 file:text-foreground file:hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              {image && (
                <div className="relative overflow-hidden rounded-lg border border-border/60 bg-muted/50">
                  <img
                    src={image}
                    alt="Recipe preview"
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">
              Source link
            </span>
            <input
              className="w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              value={sourceUrl}
              onChange={event => setSourceUrl(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — link to the original source or blog post.
            </p>
          </label>
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
