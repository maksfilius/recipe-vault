import { useState } from "react";
import { Recipe, RecipeCategory } from "../../../types/recipe";

export type RecipeFormValues = Omit<Recipe, "id">;

type RecipeFormProps = {
  mode: "create" | "edit";
  initialValue?: Recipe;
  onSubmit: (values: RecipeFormValues) => void;
}

const categories: RecipeCategory[] = ["breakfast", "snack", "lunch", "dinner"];

export default function RecipeForm({ mode, initialValue, onSubmit } : RecipeFormProps) {
  const [title, setTitle] = useState(() => initialValue?.title ?? "");
  const [category, setCategory] = useState<RecipeCategory>(
    () => initialValue?.category ?? categories[0]
  );
  const [description, setDescription] = useState(
    () => initialValue?.description ?? ""
  );
  const [sourceUrl, setSourceUrl] = useState(
    () => initialValue?.sourceUrl ?? ""
  );
  const [image, setImage] = useState<string>(
    () => initialValue?.image ?? ""
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      category,
      description: description.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      image: image || undefined,
    });
  };

  return (
    <div className="">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1F2937] text-white p-6 rounded-lg w-full max-w-xl space-y-4"
      >
        <input
          className="w-full border p-2"
          placeholder="Recipe name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <select
          className="w-full border p-2"
          value={category}
          onChange={(event) => setCategory(event.target.value as RecipeCategory)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <textarea
          className="w-full border p-2"
          placeholder="Recipe description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (file) {
              const objectUrl = URL.createObjectURL(file);
              setImage(objectUrl);
            } else {
              setImage("");
            }
          }}
          className="w-full border p-2"
        />

        <input
          className="w-full border p-2"
          placeholder="Link to an external source"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary rounded shadow-md transition"
        >
          {mode === "edit" ? "Update recipe" : "Save recipe"}
        </button>
      </form>
    </div>
  )
}
