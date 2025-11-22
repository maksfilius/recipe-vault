import {useState} from "react";

const categories = ['breakfast', 'snack', 'lunch', 'dinner']

export default function RecipeForm() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const recipe = {
      title,
      category,
      description,
      sourceUrl,
      imageFile,
    };

    console.log('Recipe:', recipe);
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
          onChange={(event) => setCategory(event.target.value)}
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
            setImageFile(file);
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
          Save
        </button>
      </form>
    </div>
  )
}