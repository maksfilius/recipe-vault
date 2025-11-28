import {Recipe} from "@/src/types/recipe";

type RecipeDetailsProps = {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
}

export function RecipeDetails ({recipe, onBack, onEdit} : RecipeDetailsProps) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-muted-foreground">
        Back to recipes
      </button>

      <h1 className="text-2xl font-semibold">{recipe.title}</h1>
      <p className="text-sm text-muted-foreground">{recipe.description}</p>

      <button onClick={onEdit} className="text-sm text-muted-foreground">
        Edit recipe
      </button>
    </div>
  );
}