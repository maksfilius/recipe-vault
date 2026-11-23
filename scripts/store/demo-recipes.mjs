// Demo cookbook for Chrome Web Store and landing screenshots. The text is our own; photos are
// Unsplash (free commercial use, no attribution required): roast-chicken Bs_4ce9_w0I,
// tomato-pasta 7ClANzfw6iU, shakshuka gWkvURhoMlA, caesar-salad HsSNbTSCdSs,
// chocolate-loaf gZ7JK_wpFrY, meal-prep-bowls w0JzqJZYX_E.
// Recipes without sourceUrl stand for recipes added by hand.
// Local-only demo account (seed-demo-library.mjs refuses non-local Supabase).
export const DEMO_EMAIL = "demo@keepandcook.test";
export const DEMO_PASSWORD = "demo-cookbook-2026";

const list = (prefix, items) => items.map((item, index) => ({ id: `${prefix}-${index + 1}`, ...item }));

export const demoRecipes = [
  {
    photo: "roast-chicken",
    title: "Lemon & herb roast chicken",
    description: "A simple Sunday roast with crisp skin, soft potatoes and a bright pan sauce.",
    sourceUrl: "https://example.com/recipes/lemon-herb-roast-chicken",
    totalTime: "1 hr 15 min",
    servings: "4 servings",
    ingredients: list("chicken", [
      { amount: "1", unit: "kg", name: "whole chicken" },
      { amount: "600", unit: "g", name: "small potatoes, halved" },
      { amount: "2", name: "lemons" },
      { amount: "4", unit: "sprigs", name: "fresh thyme" },
      { amount: "3", unit: "cloves", name: "garlic" },
      { amount: "2", unit: "tbsp", name: "olive oil" },
      { amount: "1", unit: "tsp", name: "sea salt" },
    ]),
    steps: list("chicken-step", [
      { text: "Heat the oven to 200°C. Pat the chicken dry and season it all over with salt." },
      { text: "Zest one lemon into the olive oil with the thyme leaves and crushed garlic. Rub the mixture over and under the skin." },
      { text: "Toss the potatoes in the roasting tin, set the chicken on top and tuck the halved lemons inside. Roast for 60 minutes." },
      { text: "Rest the chicken for 15 minutes. Squeeze the roasted lemon into the pan juices and spoon them over the potatoes." },
    ]),
  },
  {
    photo: "shakshuka",
    title: "Shakshuka",
    description: "Eggs poached in a smoky tomato and pepper sauce. Breakfast in one pan.",
    sourceUrl: "https://example.com/recipes/shakshuka",
    totalTime: "30 min",
    servings: "2 servings",
    ingredients: list("shakshuka", [
      { amount: "1", name: "red pepper, sliced" },
      { amount: "1", name: "onion, sliced" },
      { amount: "400", unit: "g", name: "chopped tomatoes" },
      { amount: "1", unit: "tsp", name: "smoked paprika" },
      { amount: "4", name: "eggs" },
      { name: "parsley, to serve" },
    ]),
    steps: list("shakshuka-step", [
      { text: "Soften the onion and pepper in a little oil for 8 minutes." },
      { text: "Add the paprika and tomatoes and simmer for 10 minutes until thick." },
      { text: "Make four wells, crack in the eggs, cover and cook for 6 minutes." },
      { text: "Scatter with parsley and serve from the pan." },
    ]),
  },
  {
    photo: "tomato-pasta",
    title: "Tomato basil spaghetti",
    description: "The weeknight pasta: a quick tomato sauce, plenty of basil and good olive oil.",
    sourceUrl: "https://example.com/recipes/tomato-basil-spaghetti",
    totalTime: "25 min",
    servings: "4 servings",
    ingredients: list("pasta", [
      { amount: "400", unit: "g", name: "spaghetti" },
      { amount: "800", unit: "g", name: "tinned tomatoes" },
      { amount: "2", unit: "cloves", name: "garlic" },
      { amount: "1", unit: "bunch", name: "basil" },
      { amount: "3", unit: "tbsp", name: "olive oil" },
    ]),
    steps: list("pasta-step", [
      { text: "Cook the spaghetti in well-salted water for 10 minutes." },
      { text: "Warm the garlic in the olive oil, add the tomatoes and simmer while the pasta cooks." },
      { text: "Toss the pasta with the sauce and a splash of pasta water. Tear over the basil." },
    ]),
  },
  {
    photo: "chocolate-loaf",
    title: "Grandma’s chocolate crumb loaf",
    description: "Written down from the family notebook. Dense, not too sweet, better the next day.",
    totalTime: "1 hr 10 min",
    servings: "10 slices",
    ingredients: list("loaf", [
      { amount: "200", unit: "g", name: "plain flour" },
      { amount: "40", unit: "g", name: "cocoa powder" },
      { amount: "150", unit: "g", name: "brown sugar" },
      { amount: "150", unit: "g", name: "butter, melted" },
      { amount: "2", name: "eggs" },
      { amount: "200", unit: "ml", name: "milk" },
    ]),
    steps: list("loaf-step", [
      { text: "Heat the oven to 180°C and line a loaf tin." },
      { text: "Rub 50 g each of flour, sugar and butter together for the crumb and set aside." },
      { text: "Whisk the rest of the ingredients into a batter, pour into the tin and scatter over the crumb." },
      { text: "Bake for 50 minutes, then cool in the tin." },
    ]),
  },
  {
    photo: "caesar-salad",
    title: "Chicken Caesar salad",
    description: "Crisp romaine, garlic croutons and a lemony dressing.",
    sourceUrl: "https://example.com/recipes/chicken-caesar-salad",
    totalTime: "20 min",
    servings: "2 servings",
    ingredients: list("caesar", [
      { amount: "2", name: "chicken breasts" },
      { amount: "1", name: "romaine lettuce" },
      { amount: "2", unit: "slices", name: "sourdough, cubed" },
      { amount: "30", unit: "g", name: "parmesan" },
      { amount: "3", unit: "tbsp", name: "Caesar dressing" },
    ]),
    steps: list("caesar-step", [
      { text: "Grill the chicken for 6 minutes on each side, then slice." },
      { text: "Toast the bread cubes in a hot pan with a little oil." },
      { text: "Toss the lettuce with the dressing and top with chicken, croutons and parmesan." },
    ]),
  },
  {
    photo: "meal-prep-bowls",
    title: "Sunday meal-prep bowls",
    description: "Four lunches from one tray: salmon, chicken, rice and roasted vegetables.",
    totalTime: "50 min",
    servings: "4 bowls",
    ingredients: list("bowls", [
      { amount: "2", name: "salmon fillets" },
      { amount: "2", name: "chicken thighs" },
      { amount: "250", unit: "g", name: "rice" },
      { amount: "1", name: "sweet potato, cubed" },
      { amount: "1", name: "head of broccoli" },
    ]),
    steps: list("bowls-step", [
      { text: "Roast the sweet potato and chicken at 200°C for 35 minutes, adding the salmon and broccoli for the last 15." },
      { text: "Cook the rice while the tray roasts." },
      { text: "Divide everything between four containers and chill." },
    ]),
  },
];
