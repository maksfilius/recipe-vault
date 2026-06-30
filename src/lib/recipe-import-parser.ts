import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { RECIPE_CATEGORIES, type Ingredient, type RecipeCategory, type Step } from "../types/recipe.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ImportedRecipePayload = {
  title: string;
  description: string;
  category: RecipeCategory;
  ingredients: Ingredient[];
  steps: Step[];
  sourceUrl: string;
};

type TextBlock = {
  lines: string[];
  ordered: boolean;
};

type ScoredBlock = {
  lines: string[];
  score: number;
};

const AMOUNT_PATTERN =
  String.raw`(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉])(?:\s*[-–]\s*(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉]))?`;

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

export function decodeRecipeHtml(bytes: Uint8Array, contentType: string) {
  const charset =
    extractCharsetFromContentType(contentType) ?? extractCharsetFromHtmlHead(bytes) ?? "utf-8";

  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
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

function normalizeText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return value as Record<string, JsonValue>;
}

function firstString(...values: JsonValue[]) {
  for (const value of values) {
    if (typeof value === "string") {
      const normalized = normalizeText(value);
      if (normalized) return normalized;
    }
  }

  return "";
}

function parseJsonLdCandidates($: cheerio.CheerioAPI) {
  return $('script[type="application/ld+json"]')
    .toArray()
    .flatMap((element) => {
      const raw = $(element).contents().text().trim();
      if (!raw) return [];

      try {
        return [JSON.parse(raw) as JsonValue];
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

  const objectNode = asRecord(node);
  if (!objectNode) return [];

  const typeField = objectNode["@type"];
  const types = Array.isArray(typeField) ? typeField : [typeField];
  const hasRecipeType = types
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase() === "recipe");

  if (hasRecipeType) {
    return [objectNode];
  }

  return [
    ...flattenJsonLdRecipes(objectNode["@graph"] ?? null),
    ...flattenJsonLdRecipes(objectNode.mainEntity ?? null),
    ...flattenJsonLdRecipes(objectNode.itemListElement ?? null),
  ];
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

  const record = asRecord(value);
  if (!record) return [];

  return [
    ...parseInstructionText(record.itemListElement ?? null),
    ...parseInstructionText(record.text ?? record.name ?? null),
  ];
}

function looksLikeAmount(value: string) {
  return new RegExp(`^${AMOUNT_PATTERN}(?:\\s|$|[\\p{L}%]{1,6}\\.?(?:\\s|$))`, "u").test(
    normalizeText(value),
  );
}

function parseTrailingQuantity(value: string) {
  const match = normalizeText(value).match(new RegExp(`^(${AMOUNT_PATTERN})(?:\\s+(.+))?$`, "u"));
  if (!match) return null;

  return {
    amount: normalizeText(match[1]) || undefined,
    unit: normalizeText(match[2] ?? ""),
  };
}

function scoreIngredientLine(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return 0;

  if (/\s[-–]\s/.test(normalized) && new RegExp(AMOUNT_PATTERN, "u").test(normalized)) {
    return 1;
  }

  if (/\s[-–]\s/.test(normalized)) {
    return 0.55;
  }

  return looksLikeAmount(normalized) ? 0.75 : 0;
}

function splitUnitAndName(value: string) {
  const normalized = normalizeText(value);
  const parts = normalized.split(/\s+/);

  if (parts.length < 2) {
    return { unit: "", name: normalized };
  }

  const [candidateUnit, ...rest] = parts;
  const isCompactUnit =
    candidateUnit.length <= 4 ||
    /[./]/.test(candidateUnit) ||
    candidateUnit === candidateUnit.toUpperCase();

  if (!isCompactUnit) {
    return { unit: "", name: normalized };
  }

  return {
    unit: candidateUnit,
    name: normalizeText(rest.join(" ")),
  };
}

function parseLeadingAmount(value: string) {
  const spacedMatch = normalizeText(value).match(new RegExp(`^(${AMOUNT_PATTERN})(?:\\s+(.+))?$`, "u"));
  if (spacedMatch) {
    return {
      amount: normalizeText(spacedMatch[1]) || undefined,
      remainder: normalizeText(spacedMatch[2] ?? ""),
    };
  }

  const compactMatch = normalizeText(value).match(
    new RegExp(`^(${AMOUNT_PATTERN})([\\p{L}%]{1,6}\\.?)(?:\\s+(.+))?$`, "u"),
  );
  if (!compactMatch) return null;

  return {
    amount: normalizeText(compactMatch[1]) || undefined,
    remainder: normalizeText(`${compactMatch[2]} ${compactMatch[3] ?? ""}`),
  };
}

export function parseIngredientLine(value: string): Ingredient {
  const normalized = normalizeText(value);
  const dashedParts = normalized.split(/\s+[-–]\s+/);

  if (dashedParts.length >= 2) {
    const quantityPart = dashedParts.pop() ?? "";
    const name = normalizeText(dashedParts.join(" - "));
    const parsedQuantity = parseTrailingQuantity(quantityPart);

    if (parsedQuantity) {
      return {
        id: createId(),
        name: name || normalized,
        amount: parsedQuantity.amount,
        unit: parsedQuantity.unit,
      };
    }

    return {
      id: createId(),
      name: name || normalized,
      amount: undefined,
      unit: normalizeText(quantityPart),
    };
  }

  const leadingMatch = parseLeadingAmount(normalized);
  if (leadingMatch) {
    const remainder = leadingMatch.remainder;
    const { unit, name } = splitUnitAndName(remainder);

    return {
      id: createId(),
      name: name || remainder || normalized,
      amount: leadingMatch.amount,
      unit,
    };
  }

  return {
    id: createId(),
    name: normalized,
    amount: undefined,
    unit: "",
  };
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
  const content = $(`meta[${attr}="${value}"]`).first().attr("content");
  return normalizeText(content ?? "");
}

function extractTextOrContent($: cheerio.CheerioAPI, element: AnyNode) {
  return normalizeText($(element).attr("content") ?? $(element).text());
}

function extractItempropTexts($: cheerio.CheerioAPI, selector: string) {
  return uniqueStrings(
    $(selector)
      .toArray()
      .map((element) => extractTextOrContent($, element)),
  );
}

function extractTitleFallback($: cheerio.CheerioAPI) {
  return (
    extractMetaContent($, "property", "og:title") ||
    extractItempropTexts($, '[itemprop~="name"]').at(0) ||
    normalizeText($("h1").first().text()) ||
    normalizeText($("title").first().text())
  );
}

function extractDescriptionFallback($: cheerio.CheerioAPI) {
  return (
    extractMetaContent($, "property", "og:description") ||
    extractMetaContent($, "name", "description") ||
    extractItempropTexts($, '[itemprop~="description"]').at(0) ||
    normalizeText($("article p, main p").first().text())
  );
}

function extractIngredientsFromMicrodata($: cheerio.CheerioAPI) {
  return extractItempropTexts(
    $,
    [
      '[itemprop~="recipeIngredient"]',
      '[itemprop~="ingredients"]',
      '[property~="recipeIngredient"]',
      '[property~="ingredients"]',
    ].join(", "),
  ).map(parseIngredientLine);
}

function extractStepsFromMicrodata($: cheerio.CheerioAPI) {
  const instructionNodes = $('[itemprop~="recipeInstructions"], [property~="recipeInstructions"]').toArray();
  const nested = uniqueStrings(
    instructionNodes.flatMap((element) => {
      const childTexts = $(element)
        .find('[itemprop~="text"], [itemprop~="name"], [property~="text"], [property~="name"], li, p')
        .toArray()
        .map((child) => extractTextOrContent($, child));

      return childTexts.length > 0 ? childTexts : [extractTextOrContent($, element)];
    }),
  );

  return nested.map((text) => ({ id: createId(), text }));
}

function extractListBlocks($: cheerio.CheerioAPI): TextBlock[] {
  return $(
    [
      "article ul",
      "article ol",
      "main ul",
      "main ol",
      "[role='main'] ul",
      "[role='main'] ol",
      "[class*='recipe' i] ul",
      "[class*='recipe' i] ol",
      "[id*='recipe' i] ul",
      "[id*='recipe' i] ol",
    ].join(", "),
  )
    .toArray()
    .map((element) => ({
      ordered: ($(element).prop("tagName") ?? "").toLowerCase() === "ol",
      lines: uniqueStrings(
        $(element)
          .children("li")
          .toArray()
          .map((child) => $(child).text()),
      ),
    }))
    .filter((block) => block.lines.length > 0);
}

function extractIngredientsFallback($: cheerio.CheerioAPI): Ingredient[] {
  const tableBlock = extractIngredientTableBlock($);
  if (tableBlock) {
    return tableBlock.lines.map(parseIngredientLine);
  }

  const hintedBlock = extractHintedIngredientBlock($);
  if (hintedBlock) {
    return hintedBlock.lines.map(parseIngredientLine);
  }

  const bestBlock = extractListBlocks($)
    .filter((block) => !block.ordered)
    .map((block) => ({
      block,
      score: block.lines.reduce((total, line) => total + scoreIngredientLine(line), 0) / block.lines.length,
    }))
    .filter(({ block, score }) => block.lines.length >= 2 && score >= 0.5)
    .sort((a, b) => b.score - a.score || b.block.lines.length - a.block.lines.length)
    .at(0)?.block;

  return bestBlock ? bestBlock.lines.map(parseIngredientLine) : [];
}

function getElementHints($: cheerio.CheerioAPI, element: AnyNode) {
  return [
    $(element).attr("class"),
    $(element).attr("id"),
    $(element).attr("data-testid"),
    $(element).attr("data-test"),
    $(element).attr("aria-label"),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function hasAnyHint(haystack: string, hints: string[]) {
  return hints.some((hint) => haystack.includes(hint));
}

function extractHintedIngredientBlock($: cheerio.CheerioAPI) {
  return $("article *, main *, [role='main'] *, body *")
    .toArray()
    .filter((element) => hasAnyHint(getElementHints($, element), ["ingredient", "zutaten"]))
    .map((element): ScoredBlock => {
      const childLines = uniqueStrings(
        $(element)
          .find("li, p, tr, [itemprop~='recipeIngredient'], [property~='recipeIngredient']")
          .toArray()
          .map((child) => $(child).text()),
      );
      const lines = childLines.length > 0 ? childLines : [$(element).text()];
      const ingredientLines = lines.filter(
        (line) => line.length <= 220 && scoreIngredientLine(line) > 0,
      );

      return {
        lines: ingredientLines,
        score:
          lines.length > 0
            ? ingredientLines.reduce((total, line) => total + scoreIngredientLine(line), 0) / lines.length
            : 0,
      };
    })
    .filter((block) => block.lines.length >= 2 && block.score >= 0.35)
    .sort((a, b) => b.score - a.score || b.lines.length - a.lines.length)
    .at(0);
}

function extractIngredientTableBlock($: cheerio.CheerioAPI) {
  return $("article table, main table, [role='main'] table, body table")
    .toArray()
    .map((table): ScoredBlock => {
      const lines = uniqueStrings(
        $(table)
          .find("tr")
          .toArray()
          .map((row) => $(row).text()),
      );
      const ingredientLines = lines.filter(
        (line) => line.length <= 220 && scoreIngredientLine(line) > 0,
      );

      return {
        lines: ingredientLines,
        score:
          lines.length > 0
            ? ingredientLines.reduce((total, line) => total + scoreIngredientLine(line), 0) / lines.length
            : 0,
      };
    })
    .filter((block) => block.lines.length >= 2 && block.score >= 0.45)
    .sort((a, b) => b.score - a.score || b.lines.length - a.lines.length)
    .at(0);
}

function extractStepsFallback($: cheerio.CheerioAPI): Step[] {
  const hintedBlock = extractHintedStepBlock($);
  if (hintedBlock) {
    return hintedBlock.lines.map((text) => ({ id: createId(), text }));
  }

  const repeatedBlock = extractRepeatedTextBlock($);
  if (repeatedBlock) {
    return repeatedBlock.lines.map((text) => ({ id: createId(), text }));
  }

  const bestBlock = extractListBlocks($)
    .map((block) => ({
      block,
      score:
        (block.ordered ? 1 : 0) +
        block.lines.filter((line) => normalizeText(line).length >= 24).length / block.lines.length,
    }))
    .filter(({ block, score }) => block.lines.length >= 2 && score >= 0.8)
    .sort((a, b) => b.score - a.score || b.block.lines.length - a.block.lines.length)
    .at(0)?.block;

  return bestBlock ? bestBlock.lines.map((text) => ({ id: createId(), text })) : [];
}

function extractHintedStepBlock($: cheerio.CheerioAPI) {
  return $("article *, main *, [role='main'] *, body *")
    .toArray()
    .filter((element) =>
      hasAnyHint(getElementHints($, element), [
        "instruction",
        "direction",
        "preparation",
        "method",
        "step",
        "zubereitung",
        "anleitung",
      ]),
    )
    .map((element): ScoredBlock => {
      const childLines = uniqueStrings(
        $(element)
          .find("li, p, [itemprop~='text'], [property~='text']")
          .toArray()
          .map((child) => $(child).text()),
      );
      const lines = childLines.length > 0 ? childLines : [$(element).text()];
      const stepLines = lines.filter((line) => normalizeText(line).length >= 16);

      return {
        lines: stepLines,
        score: lines.length > 0 ? stepLines.length / lines.length : 0,
      };
    })
    .filter((block) => block.lines.length >= 2 && block.score >= 0.5)
    .sort((a, b) => b.lines.length - a.lines.length || b.score - a.score)
    .at(0);
}

function getClassSignature($: cheerio.CheerioAPI, element: AnyNode) {
  const className = ($(element).attr("class") ?? "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .sort()
    .join(".");

  return className ? `${$(element).prop("tagName")?.toLowerCase() ?? "node"}.${className}` : "";
}

function extractRepeatedTextBlock($: cheerio.CheerioAPI) {
  const groups = new Map<string, string[]>();

  $("article *, main *, [role='main'] *, body *").each((_, element) => {
    const signature = getClassSignature($, element);
    if (!signature) return;

    const directParagraphs = $(element)
      .children("p")
      .toArray()
      .map((child) => normalizeText($(child).text()))
      .filter((line) => line.length >= 24);

    if (directParagraphs.length === 0) return;

    const current = groups.get(signature) ?? [];
    groups.set(signature, [...current, ...directParagraphs]);
  });

  return [...groups.values()]
    .map((lines) => uniqueStrings(lines))
    .filter((lines) => lines.length >= 2)
    .map((lines): ScoredBlock => ({
      lines,
      score: lines.filter((line) => line.length >= 32).length / lines.length,
    }))
    .filter((block) => block.score >= 0.75)
    .sort((a, b) => b.lines.length - a.lines.length || b.score - a.score)
    .at(0);
}

function isNoisyDescription(description: string, title: string) {
  const normalized = normalizeText(description);
  if (!normalized) return true;

  const punctuationCount = (normalized.match(/[,;]/g) ?? []).length;
  const mentionsTitle = title && normalized.toLowerCase().includes(title.toLowerCase());

  return normalized.length > 140 && punctuationCount >= 8 && Boolean(mentionsTitle);
}

function parseCategory(value: JsonValue): RecipeCategory | null {
  const category = firstString(...toArray(value));
  if (!category) return null;

  const normalized = category.toLowerCase();
  return RECIPE_CATEGORIES.find((item) => item === normalized) ?? null;
}

export function buildImportedRecipe(html: string, sourceUrl: string): ImportedRecipePayload | null {
  const $ = cheerio.load(html);
  const recipe = parseJsonLdCandidates($).flatMap(flattenJsonLdRecipes)[0];

  const title = firstString(recipe?.name ?? null) || extractTitleFallback($);
  const recipeDescription = firstString(recipe?.description ?? null);
  const fallbackDescription = extractDescriptionFallback($);
  const description =
    recipeDescription && !isNoisyDescription(recipeDescription, title)
      ? recipeDescription
      : fallbackDescription && !isNoisyDescription(fallbackDescription, title)
        ? fallbackDescription
        : title;
  const ingredients = parseIngredients(recipe?.recipeIngredient ?? null);
  const steps = parseSteps(recipe?.recipeInstructions ?? null);

  const fallbackIngredients =
    ingredients.length > 0 ? ingredients : extractIngredientsFromMicrodata($);
  const fallbackSteps = steps.length > 0 ? steps : extractStepsFromMicrodata($);

  if (!title) {
    return null;
  }

  return {
    title,
    description,
    category: parseCategory(recipe?.recipeCategory ?? null) ?? "dinner",
    ingredients:
      fallbackIngredients.length > 0 ? fallbackIngredients : extractIngredientsFallback($),
    steps: fallbackSteps.length > 0 ? fallbackSteps : extractStepsFallback($),
    sourceUrl,
  };
}
