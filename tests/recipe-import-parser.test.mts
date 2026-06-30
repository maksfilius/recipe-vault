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
