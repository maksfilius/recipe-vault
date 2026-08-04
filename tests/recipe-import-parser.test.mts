import test from "node:test";
import assert from "node:assert/strict";

import { buildImportedRecipe } from "../src/lib/recipe-import-parser.ts";

test("imports an English JSON-LD recipe", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Apple Pancakes",
          "description": "Simple breakfast pancakes.",
          "recipeIngredient": ["1 cup flour", "2 eggs", "1/2 cup milk"],
          "recipeInstructions": [
            {"@type": "HowToStep", "text": "Mix all ingredients."},
            {"@type": "HowToStep", "text": "Cook in a hot pan."}
          ]
        }
      </script>
    `,
    "https://example.com/apple-pancakes",
  );

  assert.equal(recipe?.title, "Apple Pancakes");
  assert.equal(recipe?.ingredients[0]?.amount, "1");
  assert.equal(recipe?.ingredients[0]?.unit, "cup");
  assert.equal(recipe?.ingredients[0]?.name, "flour");
  assert.equal(recipe?.ingredients[1]?.name, "eggs");
  assert.equal(recipe?.steps.length, 2);
});

test("imports a German JSON-LD recipe without language-specific rules", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Kartoffelsuppe",
          "description": "Cremige Suppe.",
          "recipeIngredient": ["500 g Kartoffeln", "1 Zwiebel", "750 ml Gemüsebrühe"],
          "recipeInstructions": [
            "Kartoffeln schälen und würfeln.",
            "Alles kochen und pürieren."
          ]
        }
      </script>
    `,
    "https://example.de/kartoffelsuppe",
  );

  assert.equal(recipe?.title, "Kartoffelsuppe");
  assert.equal(recipe?.ingredients[0]?.amount, "500");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.ingredients[0]?.name, "Kartoffeln");
  assert.equal(recipe?.ingredients[1]?.name, "Zwiebel");
  assert.equal(recipe?.steps[0]?.text, "Kartoffeln schälen und würfeln.");
});

test("imports a Russian JSON-LD recipe without language-specific rules", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Блины",
          "description": "Тонкие домашние блины.",
          "recipeIngredient": ["200 г муки", "2 яйца", "500 мл молока"],
          "recipeInstructions": [
            {"@type": "HowToStep", "text": "Смешайте ингредиенты."},
            {"@type": "HowToStep", "text": "Жарьте блины на сковороде."}
          ]
        }
      </script>
    `,
    "https://example.ru/bliny",
  );

  assert.equal(recipe?.title, "Блины");
  assert.equal(recipe?.ingredients[0]?.amount, "200");
  assert.equal(recipe?.ingredients[0]?.unit, "г");
  assert.equal(recipe?.ingredients[0]?.name, "муки");
  assert.equal(recipe?.ingredients[1]?.name, "яйца");
  assert.equal(recipe?.steps[1]?.text, "Жарьте блины на сковороде.");
});

test("imports recipe microdata when JSON-LD is absent", () => {
  const recipe = buildImportedRecipe(
    `
      <main itemscope itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Tomato Pasta</h1>
        <p itemprop="description">Fast pasta dinner.</p>
        <ul>
          <li itemprop="recipeIngredient">200 g pasta</li>
          <li itemprop="recipeIngredient">3 tomatoes</li>
        </ul>
        <ol itemprop="recipeInstructions">
          <li itemprop="text">Boil the pasta.</li>
          <li itemprop="text">Cook tomatoes and mix everything.</li>
        </ol>
      </main>
    `,
    "https://example.com/tomato-pasta",
  );

  assert.equal(recipe?.title, "Tomato Pasta");
  assert.equal(recipe?.ingredients.length, 2);
  assert.equal(recipe?.steps.length, 2);
});

test("falls back to structured tables and repeated step blocks", () => {
  const recipe = buildImportedRecipe(
    `
      <html>
        <head>
          <meta name="description" content="Recipe Braised potatoes, ingredients: potatoes, meat, onion, carrot, tomato sauce, garlic, oil, salt, pepper, bay leaf, dill; dinner, lunch, beginner, family meal, time 40 min.">
        </head>
        <body>
          <h1>Braised potatoes</h1>
          <table>
            <tr><td>Products for 2 servings</td></tr>
            <tr><td>Potatoes - 350 g</td></tr>
            <tr><td>Ground meat - 200 g</td></tr>
            <tr><td>Pepper - pinch</td></tr>
          </table>
          <div class="step_n"><p>Prepare the ingredients and heat the pan.</p></div>
          <div class="step_n"><p>Cook the vegetables until softened.</p></div>
          <div class="step_n"><p>Add meat and simmer until everything is done.</p></div>
        </body>
      </html>
    `,
    "https://example.com/braised-potatoes",
  );

  assert.equal(recipe?.description, "Braised potatoes");
  assert.equal(recipe?.ingredients.length, 3);
  assert.equal(recipe?.ingredients[0]?.name, "Potatoes");
  assert.equal(recipe?.ingredients[0]?.amount, "350");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.ingredients[2]?.name, "Pepper");
  assert.equal(recipe?.ingredients[2]?.unit, "pinch");
  assert.equal(recipe?.steps.length, 3);
});

test("parses compact English and German ingredient quantities", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Mixed Measurements",
          "description": "A measurement parser check.",
          "recipeIngredient": ["250g flour", "1 1/2 cups milk", "1½ cups oats", "2 EL Öl"],
          "recipeInstructions": ["Mix everything.", "Cook until done."]
        }
      </script>
    `,
    "https://example.com/measurements",
  );

  assert.equal(recipe?.ingredients[0]?.amount, "250");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.ingredients[0]?.name, "flour");
  assert.equal(recipe?.ingredients[1]?.amount, "1 1/2");
  assert.equal(recipe?.ingredients[1]?.name, "milk");
  assert.equal(recipe?.ingredients[2]?.amount, "1½");
  assert.equal(recipe?.ingredients[2]?.name, "oats");
  assert.equal(recipe?.ingredients[3]?.amount, "2");
  assert.equal(recipe?.ingredients[3]?.unit, "EL");
  assert.equal(recipe?.ingredients[3]?.name, "Öl");
});

test("uses hinted English and German HTML blocks when schema data is absent", () => {
  const recipe = buildImportedRecipe(
    `
      <main>
        <h1>Ofengemüse</h1>
        <p>Ein einfaches Abendessen vom Blech.</p>
        <section class="recipe-zutaten">
          <p>500g Kartoffeln</p>
          <p>2 EL Olivenöl</p>
          <p>1 rote Zwiebel</p>
        </section>
        <section id="recipe-anleitung">
          <p>Kartoffeln waschen und schneiden.</p>
          <p>Alles mit Öl vermengen und würzen.</p>
          <p>Im Ofen backen, bis das Gemüse weich ist.</p>
        </section>
      </main>
    `,
    "https://example.de/ofengemuese",
  );

  assert.equal(recipe?.title, "Ofengemüse");
  assert.equal(recipe?.ingredients.length, 3);
  assert.equal(recipe?.ingredients[0]?.amount, "500");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.ingredients[0]?.name, "Kartoffeln");
  assert.equal(recipe?.steps.length, 3);
});

test("imports RDFa recipe properties", () => {
  const recipe = buildImportedRecipe(
    `
      <article typeof="Recipe">
        <h1 property="name">Lemon Cake</h1>
        <p property="description">Bright and simple cake.</p>
        <ul>
          <li property="recipeIngredient">200g sugar</li>
          <li property="recipeIngredient">2 eggs</li>
        </ul>
        <ol property="recipeInstructions">
          <li property="text">Whisk the batter.</li>
          <li property="text">Bake until golden.</li>
        </ol>
      </article>
    `,
    "https://example.com/lemon-cake",
  );

  assert.equal(recipe?.ingredients.length, 2);
  assert.equal(recipe?.ingredients[0]?.amount, "200");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.steps.length, 2);
});

test("selects the most complete JSON-LD recipe candidate", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Recipe",
              "name": "Incomplete Recipe"
            },
            {
              "@type": "https://schema.org/Recipe",
              "name": "Complete Recipe",
              "description": "The useful recipe payload.",
              "recipeIngredient": [
                {"text": "300g potatoes"},
                {"name": "2 onions"}
              ],
              "recipeInstructions": {
                "@type": "ItemList",
                "itemListElement": [
                  {"@type": "HowToStep", "text": "Chop the vegetables."},
                  {"@type": "HowToStep", "text": "Cook until tender."}
                ]
              }
            }
          ]
        }
      </script>
    `,
    "https://example.com/complete-recipe",
  );

  assert.equal(recipe?.title, "Complete Recipe");
  assert.equal(recipe?.ingredients.length, 2);
  assert.equal(recipe?.ingredients[0]?.amount, "300");
  assert.equal(recipe?.ingredients[0]?.unit, "g");
  assert.equal(recipe?.ingredients[0]?.name, "potatoes");
  assert.equal(recipe?.steps.length, 2);
});

test("uses RDFa title and description fallbacks", () => {
  const recipe = buildImportedRecipe(
    `
      <article typeof="Recipe">
        <h1 property="name">RDFa Soup</h1>
        <p property="description">A soup from RDFa fields.</p>
        <ul>
          <li property="recipeIngredient">500ml stock</li>
          <li property="recipeIngredient">2 carrots</li>
        </ul>
      </article>
    `,
    "https://example.com/rdfa-soup",
  );

  assert.equal(recipe?.title, "RDFa Soup");
  assert.equal(recipe?.description, "A soup from RDFa fields.");
  assert.equal(recipe?.ingredients.length, 2);
});

test("returns null when no recipe body can be found", () => {
  const recipe = buildImportedRecipe(
    `
      <html>
        <head><title>Simple Page</title></head>
        <body><h1>Simple Page</h1><p>This is not a recipe.</p></body>
      </html>
    `,
    "https://example.com/simple-page",
  );

  assert.equal(recipe, null);
});

test("parses common ingredient units without treating adjectives as units", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "Onion Soup",
          "recipeIngredient": [
            "2 red onions",
            "3 bay leaves",
            ".5 l vegetable stock",
            "1 clove garlic"
          ],
          "recipeInstructions": ["Cook until tender."]
        }
      </script>
    `,
    "https://example.com/onion-soup",
  );

  assert.equal(recipe?.ingredients[0]?.unit, "");
  assert.equal(recipe?.ingredients[0]?.name, "red onions");
  assert.equal(recipe?.ingredients[1]?.unit, "");
  assert.equal(recipe?.ingredients[1]?.name, "bay leaves");
  assert.equal(recipe?.ingredients[2]?.amount, ".5");
  assert.equal(recipe?.ingredients[2]?.unit, "l");
  assert.equal(recipe?.ingredients[2]?.name, "vegetable stock");
  assert.equal(recipe?.ingredients[3]?.unit, "clove");
  assert.equal(recipe?.ingredients[3]?.name, "garlic");
});

test("recovers embedded JSON-LD and omits HowToSection headings from steps", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        window.recipeData = {
          "@type": "https://schema.org/Recipe",
          "name": "Flatbread",
          "recipeIngredient": ["250 g flour", "150 ml water"],
          "recipeInstructions": [
            {
              "@type": "HowToSection",
              "name": "Make the dough",
              "itemListElement": [
                {"@type": "HowToStep", "text": "1. Mix the dough."},
                {"@type": "HowToStep", "text": "2. Bake until golden."}
              ]
            }
          ]
        };
      </script>
    `,
    "https://example.com/flatbread",
  );

  assert.deepEqual(recipe?.steps.map((step) => step.text), [
    "Mix the dough.",
    "Bake until golden.",
  ]);
});

test("extracts preview metadata and resolves relative recipe images", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "Morning Granola",
          "recipeCategory": "Breakfast & Brunch",
          "keywords": "oats, healthy, Breakfast",
          "image": {"@type": "ImageObject", "url": "/images/granola.jpg"},
          "totalTime": "PT1H15M",
          "recipeYield": 4,
          "recipeIngredient": ["2 cups oats"],
          "recipeInstructions": "1. Mix everything.<br>2. Bake until crisp."
        }
      </script>
    `,
    "https://example.com/recipes/granola",
  );

  assert.equal(recipe?.suggestedCollection, "Breakfast");
  assert.deepEqual(recipe?.tags, ["oats", "healthy"]);
  assert.equal(recipe?.imageUrl, "https://example.com/images/granola.jpg");
  assert.equal(recipe?.totalTime, "1 hr 15 min");
  assert.equal(recipe?.servings, "4 servings");
  assert.deepEqual(recipe?.steps.map((step) => step.text), [
    "Mix everything.",
    "Bake until crisp.",
  ]);
});

test("parses split table cells and unquantified ingredients from hinted blocks", () => {
  const tableRecipe = buildImportedRecipe(
    `
      <main>
        <h1>Tomato Rice</h1>
        <table>
          <tr><th>Ingredient</th><th>Amount</th></tr>
          <tr><td>Rice</td><td>200 g</td></tr>
          <tr><td>Tomatoes</td><td>3 pcs.</td></tr>
        </table>
        <ol><li>Cook the rice until tender.</li><li>Fold in the tomatoes.</li></ol>
      </main>
    `,
    "https://example.com/tomato-rice",
  );

  assert.equal(tableRecipe?.ingredients.length, 2);
  assert.equal(tableRecipe?.ingredients[0]?.name, "Rice");
  assert.equal(tableRecipe?.ingredients[0]?.amount, "200");
  assert.equal(tableRecipe?.ingredients[0]?.unit, "g");

  const listRecipe = buildImportedRecipe(
    `
      <main>
        <h1>Simple Salad</h1>
        <ul class="recipe-ingredients">
          <li>Salt to taste</li>
          <li>Fresh basil</li>
          <li>Olive oil</li>
        </ul>
        <section class="recipe-instructions">
          <p>Mix well.</p>
          <p>Serve cold.</p>
        </section>
      </main>
    `,
    "https://example.com/simple-salad",
  );

  assert.deepEqual(listRecipe?.ingredients.map((ingredient) => ingredient.name), [
    "Salt to taste",
    "Fresh basil",
    "Olive oil",
  ]);
  assert.deepEqual(listRecipe?.steps.map((step) => step.text), ["Mix well.", "Serve cold."]);
});

test("pairs quantity and name fields from custom ingredient markup", () => {
  const recipe = buildImportedRecipe(
    `
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "German Chocolate Cake",
          "recipeCategory": "Kuchen",
          "prepTime": "PT30M",
          "cookTime": "PT15M",
          "recipeIngredient": {
            "0": "Butter (weich)",
            "1": "Salz",
            "2": "Eier"
          },
          "recipeInstructions": ["Mix the batter.", "."]
        }
      </script>
      <main>
        <div id="recipe-ingredients-content">
          <div class="recipe-ingredient-list">
            <div class="recipe-ingredient-list__ingredient">
              <span class="recipe-ingredient-list__ingredient__quantity">130 g</span>
              <span class="recipe-ingredient-list__ingredient__title">Butter (weich)</span>
            </div>
            <div class="recipe-ingredient-list__ingredient">
              <span class="recipe-ingredient-list__ingredient__quantity">1 Pr.</span>
              <span class="recipe-ingredient-list__ingredient__title">Salz</span>
            </div>
            <div class="recipe-ingredient-list__ingredient">
              <span class="recipe-ingredient-list__ingredient__quantity">3 Stk.</span>
              <span class="recipe-ingredient-list__ingredient__title">Eier</span>
            </div>
          </div>
        </div>
      </main>
    `,
    "https://example.de/schokokuchen",
  );

  assert.deepEqual(
    recipe?.ingredients.map(({ name, amount, unit }) => ({ name, amount, unit })),
    [
      { name: "Butter (weich)", amount: "130", unit: "g" },
      { name: "Salz", amount: "1", unit: "Pr." },
      { name: "Eier", amount: "3", unit: "Stk." },
    ],
  );
  assert.deepEqual(recipe?.steps.map((step) => step.text), ["Mix the batter."]);
  assert.equal(recipe?.suggestedCollection, "Snacks");
  assert.equal(recipe?.totalTime, "45 min");
});
