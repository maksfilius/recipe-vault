import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { type Ingredient, type RecipeCategory, type Step } from "@/src/types/recipe";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ImportedRecipePayload = {
  title: string;
  description: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl: string;
};

function createId() {
  return globalThis.crypto.randomUUID();
}

function normalizeCharset(value: string | undefined | null) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    cp1251: "windows-1251",
    win1251: "windows-1251",
    utf8: "utf-8",
  };

  return aliases[normalized] ?? normalized;
}

function normalizeText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function stripRecipeTitleNoise(value: string) {
  return normalizeText(
    value
      .replace(/^Рецепт:\s*/i, "")
      .replace(/^Recipe:\s*/i, "")
      .replace(/\s+на\s+RussianFood\.com$/i, "")
      .replace(/\s+on\s+RussianFood\.com$/i, ""),
  );
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const COMMON_MEASURE_UNITS = [
  "g",
  "kg",
  "mg",
  "ml",
  "l",
  "dl",
  "cl",
  "tsp",
  "tbsp",
  "cup",
  "cups",
  "oz",
  "lb",
  "pinch",
  "pinches",
  "clove",
  "cloves",
  "slice",
  "slices",
  "piece",
  "pieces",
  "can",
  "cans",
  "pack",
  "packs",
  "шт",
  "шт.",
  "ч. л.",
  "ч.л.",
  "ст. л.",
  "ст.л.",
  "г",
  "кг",
  "мг",
  "мл",
  "л",
  "щепотка",
  "щепотки",
  "щепоток",
  "зубчик",
  "зубчика",
  "зубчиков",
  "кусок",
  "куска",
  "кусочков",
  "банка",
  "банки",
  "упаковка",
  "упаковки",
];

function startsWithKnownUnit(value: string) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return false;

  return COMMON_MEASURE_UNITS.some((unit) => {
    const normalizedUnit = unit.toLowerCase();
    return normalized === normalizedUnit || normalized.startsWith(`${normalizedUnit} `);
  });
}

function parseAmount(value: string) {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

function parseQuantityAndUnit(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return { amount: undefined, unit: "" };
  }

  const match = normalized.match(/^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)(?:\s+(.+))?$/);
  if (!match) {
    return null;
  }

  return {
    amount: parseAmount(match[1]),
    unit: normalizeText(match[2] ?? ""),
  };
}

function parseIngredientLine(value: string): Ingredient {
  const normalized = normalizeText(value);
  const dashedParts = normalized.split(/\s+-\s+/);

  if (dashedParts.length >= 2) {
    const quantityPart = dashedParts.pop() ?? "";
    const name = normalizeText(dashedParts.join(" - "));
    const parsedQuantity = parseQuantityAndUnit(quantityPart);

    if (!parsedQuantity) {
      return {
        id: createId(),
        name: name || normalized,
        amount: undefined,
        unit: normalizeText(quantityPart),
      };
    }

    return {
      id: createId(),
      name: name || normalized,
      amount: parsedQuantity.amount,
      unit: parsedQuantity.unit,
    };
  }

  const leadingQuantityMatch = normalized.match(
    /^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)(?:\s+([^\d]+?))?\s+(.+)$/,
  );
  if (leadingQuantityMatch && startsWithKnownUnit(leadingQuantityMatch[2] ?? "")) {
    return {
      id: createId(),
      name: normalizeText(leadingQuantityMatch[3]),
      amount: parseAmount(leadingQuantityMatch[1]),
      unit: normalizeText(leadingQuantityMatch[2] ?? ""),
    };
  }

  const leadingAmountOnlyMatch = normalized.match(/^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s+(.+)$/);
  if (leadingAmountOnlyMatch) {
    return {
      id: createId(),
      name: normalizeText(leadingAmountOnlyMatch[2]),
      amount: parseAmount(leadingAmountOnlyMatch[1]),
      unit: "",
    };
  }

  return {
    id: createId(),
    name: normalized,
    amount: undefined,
    unit: "",
  };
}

function parseJsonLdCandidates($: cheerio.CheerioAPI) {
  return $('script[type="application/ld+json"]')
    .toArray()
    .flatMap((element) => {
      const raw = $(element).contents().text().trim();

      if (!raw) return [];

      try {
        const parsed = JSON.parse(raw) as JsonValue;
        return [parsed];
      } catch {
        return [];
      }
    });
}

function flattenJsonLdRecipes(node: JsonValue): Record<string, JsonValue>[] {
  if (!node) return [];

  if (Array.isArray(node)) {
    return node.flatMap(flattenJsonLdRecipes);
  }

  if (typeof node !== "object") {
    return [];
  }

  const objectNode = node as Record<string, JsonValue>;
  const typeField = objectNode["@type"];
  const types = Array.isArray(typeField) ? typeField : [typeField];
  const normalizedTypes = types
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  if (normalizedTypes.includes("recipe")) {
    return [objectNode];
  }

  const graph = objectNode["@graph"];
  if (graph) {
    return flattenJsonLdRecipes(graph);
  }

  return [];
}

function parseInstructionText(value: JsonValue): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(parseInstructionText);
  }

  if (typeof value === "object") {
    const record = value as Record<string, JsonValue>;
    return parseInstructionText(record.text ?? record.name ?? null);
  }

  return [];
}

function parseIngredients(value: JsonValue): Ingredient[] {
  return toArray(value)
    .flatMap((item) => (typeof item === "string" ? [item] : []))
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .map(parseIngredientLine);
}

function parseSteps(value: JsonValue): Step[] {
  return parseInstructionText(value).map((text) => ({
    id: createId(),
    text,
  }));
}

function extractMetaContent($: cheerio.CheerioAPI, attr: string, value: string) {
  const element = $(`meta[${attr}="${value}"]`).first();
  const content = element.attr("content");
  return normalizeText(content ?? "");
}

function extractTitleFallback($: cheerio.CheerioAPI) {
  const ogTitle = extractMetaContent($, "property", "og:title");
  if (ogTitle) return stripRecipeTitleNoise(ogTitle);

  const h1Title = stripRecipeTitleNoise($("h1").first().text());
  if (h1Title) return h1Title;

  return stripRecipeTitleNoise($("title").first().text());
}

function extractDescriptionFallback($: cheerio.CheerioAPI) {
  const h1 = $("h1").first();
  if (h1.length > 0) {
    const immediateParagraph = (h1.nextAll("div, p").first().find("p").first().text() || h1.nextAll("p").first().text());
    if (immediateParagraph && immediateParagraph.length > 30) return immediateParagraph;

    const articleParagraph = normalizeText(
      h1.closest("article, main, body").find("p").filter((_, el) => normalizeText($(el).text()).length > 30).first().text(),
    );
    if (articleParagraph) return articleParagraph;
  }

  const ogDescription = extractMetaContent($, "property", "og:description");
  if (ogDescription) return ogDescription;

  return extractMetaContent($, "name", "description");
}

function extractBlocksByAttributeKeywords(
  $: cheerio.CheerioAPI,
  keywords: string[],
  tags: string[] = ["section", "div", "ul", "ol", "table"],
) {
  return tags.flatMap((tag) =>
    $(tag)
      .toArray()
      .filter((element) => {
        const className = ($(element).attr("class") ?? "").toLowerCase();
        const id = ($(element).attr("id") ?? "").toLowerCase();
        return keywords.some((keyword) => className.includes(keyword) || id.includes(keyword));
      }),
  );
}

function extractTextsFromElements(
  $: cheerio.CheerioAPI,
  elements: AnyNode[],
  selector: string,
) {
  return uniqueStrings(
    elements.flatMap((element) =>
      $(element)
        .find(selector)
        .toArray()
        .map((child) => $(child).text()),
    ),
  );
}

function extractListItemsFromBlock($: cheerio.CheerioAPI, elements: AnyNode[]) {
  return extractTextsFromElements($, elements, "li");
}

function extractParagraphsFromBlock($: cheerio.CheerioAPI, elements: AnyNode[]) {
  return extractTextsFromElements($, elements, "p");
}

function extractTableRowsFromBlock($: cheerio.CheerioAPI, elements: AnyNode[]) {
  return uniqueStrings(
    elements.flatMap((element) =>
      $(element)
        .find("tr")
        .toArray()
        .map((row) => $(row).text()),
    ),
  );
}

function extractIngredientLinesFromBlock($: cheerio.CheerioAPI, elements: AnyNode[]) {
  const listItems = extractListItemsFromBlock($, elements);
  if (listItems.length > 0) return listItems;

  const rows = extractTableRowsFromBlock($, elements);
  if (rows.length > 0) return rows;

  const paragraphs = extractParagraphsFromBlock($, elements);
  if (paragraphs.length > 0) return paragraphs;

  return extractTextsFromElements($, elements, "span");
}

function extractStepLinesFromBlock($: cheerio.CheerioAPI, elements: AnyNode[]) {
  const listItems = extractListItemsFromBlock($, elements);
  if (listItems.length > 0) return listItems;

  return extractParagraphsFromBlock($, elements);
}

function extractGenericIngredientsFallback($: cheerio.CheerioAPI): Ingredient[] {
  const ingredientBlocks = extractBlocksByAttributeKeywords($, [
    "ingredient",
    "ingredients",
    "recipe-ingredients",
    "ingredients-list",
    "ingr",
    "products",
    "product",
    "ingredients-section",
    "ингредиент",
    "ингредиенты",
    "продукты",
  ]);

  const ingredientLines = uniqueStrings(
    ingredientBlocks
      .flatMap((element) => extractIngredientLinesFromBlock($, [element]))
      .filter((item) => item && !/^(ingredients|ingredient|продукты|ингредиенты)$/i.test(item)),
  );

  return ingredientLines.map(parseIngredientLine);
}

function extractGenericStepsFallback($: cheerio.CheerioAPI): Step[] {
  const stepBlocks = extractBlocksByAttributeKeywords($, [
    "instruction",
    "instructions",
    "direction",
    "directions",
    "method",
    "preparation",
    "prep",
    "steps",
    "howto",
    "how-to",
    "recipe-method",
    "instructions-section",
    "step",
    "step_n",
    "приготовление",
    "инструк",
    "шаг",
    "способ",
  ]);

  const lines = uniqueStrings(stepBlocks.flatMap((element) => extractStepLinesFromBlock($, [element])));

  return lines.map((text) => ({
    id: createId(),
    text,
  }));
}

function extractIngredientsFallback($: cheerio.CheerioAPI): Ingredient[] {
  const genericIngredients = extractGenericIngredientsFallback($);
  if (genericIngredients.length > 0) return genericIngredients;

  return $("table.ingr")
    .first()
    .find("span")
    .toArray()
    .map((element) => normalizeText($(element).text()))
    .filter((item) => item && !/^(продукты|\(на \d+ порц)/i.test(item))
    .map(parseIngredientLine);
}

function extractStepsFallback($: cheerio.CheerioAPI): Step[] {
  const genericSteps = extractGenericStepsFallback($);
  if (genericSteps.length > 0) return genericSteps;

  return $("div.step_n p")
    .toArray()
    .map((element) => normalizeText($(element).text()))
    .filter(Boolean)
    .map((text) => ({
      id: createId(),
      text,
    }));
}

function extractCharsetFromContentType(contentType: string) {
  const match = contentType.match(/charset=([^;]+)/i);
  return normalizeCharset(match?.[1] ?? null);
}

function extractCharsetFromHtmlHead(bytes: Uint8Array) {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));

  const metaCharsetMatch = head.match(/<meta[^>]+charset=["']?\s*([^\s"'/>]+)/i);
  if (metaCharsetMatch) {
    return normalizeCharset(metaCharsetMatch[1]);
  }

  const contentTypeMatch = head.match(
    /<meta[^>]+http-equiv=["']content-type["'][^>]+content=["'][^"']*charset=([^"';\s>]+)/i,
  );

  return normalizeCharset(contentTypeMatch?.[1] ?? null);
}

function decodeHtml(bytes: Uint8Array, contentType: string) {
  const charset = extractCharsetFromContentType(contentType) ?? extractCharsetFromHtmlHead(bytes) ?? "utf-8";

  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function guessCategory(title: string, description: string): RecipeCategory {
  const haystack = `${title} ${description}`.toLowerCase();

  if (/(breakfast|pancake|omelet|oatmeal|granola|toast)/.test(haystack)) {
    return "breakfast";
  }

  if (/(lunch|salad|sandwich|wrap|soup)/.test(haystack)) {
    return "lunch";
  }

  if (/(snack|cookie|bar|dip|chips|muffin)/.test(haystack)) {
    return "snack";
  }

  return "dinner";
}

function buildImportedRecipe(html: string, sourceUrl: string): ImportedRecipePayload | null {
  const $ = cheerio.load(html);
  const recipes = parseJsonLdCandidates($).flatMap(flattenJsonLdRecipes);
  const recipe = recipes[0];

  const title =
    normalizeText((typeof recipe?.name === "string" ? recipe.name : "") || extractTitleFallback($));
  const description =
    normalizeText(
      (typeof recipe?.description === "string" ? recipe.description : "") || extractDescriptionFallback($),
    );
  const ingredients = parseIngredients(recipe?.recipeIngredient ?? null);
  const fallbackIngredients = ingredients.length > 0 ? ingredients : extractIngredientsFallback($);
  const steps = parseSteps(recipe?.recipeInstructions ?? null);
  const fallbackSteps = steps.length > 0 ? steps : extractStepsFallback($);

  if (!title) {
    return null;
  }

  return {
    title,
    description,
    category: guessCategory(title, description),
    ingredients: fallbackIngredients,
    steps: fallbackSteps,
    sourceUrl,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "A recipe URL is required." }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Only http and https URLs are supported." }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; RecipeVaultBot/1.0; +https://recipevault.app)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch this page (${response.status}).` },
        { status: 400 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "This URL did not return an HTML page." },
        { status: 400 },
      );
    }

    const htmlBytes = new Uint8Array(await response.arrayBuffer());
    const html = decodeHtml(htmlBytes, contentType);
    const importedRecipe = buildImportedRecipe(html, parsedUrl.toString());

    if (!importedRecipe) {
      return NextResponse.json(
        { error: "No recipe data was found on this page." },
        { status: 422 },
      );
    }

    return NextResponse.json(importedRecipe);
  } catch {
    return NextResponse.json(
      { error: "Failed to import recipe from this URL." },
      { status: 500 },
    );
  }
}
