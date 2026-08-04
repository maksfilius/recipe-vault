import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import type { ImportedRecipe, Ingredient, Step } from "../types/recipe.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ImportedRecipePayload = ImportedRecipe;

type TextBlock = {
  lines: string[];
  ordered: boolean;
};

type ScoredBlock = {
  lines: string[];
  score: number;
};

const AMOUNT_PATTERN =
  String.raw`(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|[.,]\d+|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉])(?:\s*[-–]\s*(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|[.,]\d+|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉]))?`;

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_INGREDIENTS = 100;
const MAX_STEPS = 100;

const UNIT_NAMES = [
  "fluid ounces",
  "tablespoons",
  "tablespoon",
  "teaspoons",
  "teaspoon",
  "milliliters",
  "millilitres",
  "centiliters",
  "centilitres",
  "deciliters",
  "decilitres",
  "kilograms",
  "milligrams",
  "kilogram",
  "milligram",
  "packages",
  "package",
  "packets",
  "packet",
  "pounds",
  "pound",
  "ounces",
  "ounce",
  "pinches",
  "pinch",
  "cloves",
  "clove",
  "pieces",
  "piece",
  "handfuls",
  "handful",
  "heads",
  "head",
  "slices",
  "slice",
  "sprigs",
  "sprig",
  "sticks",
  "stick",
  "bunches",
  "bunch",
  "cups",
  "cup",
  "cans",
  "can",
  "dashes",
  "dash",
  "esslöffel",
  "teelöffel",
  "päckchen",
  "packungen",
  "packung",
  "scheiben",
  "scheibe",
  "stück",
  "becher",
  "glas",
  "bund",
  "prise",
  "prisen",
  "zehen",
  "zehe",
  "dosen",
  "dose",
  "столовые ложки",
  "столовая ложка",
  "чайные ложки",
  "чайная ложка",
  "стаканов",
  "стакана",
  "стакан",
  "щепотки",
  "щепотка",
  "зубчиков",
  "зубчика",
  "зубчик",
  "штук",
  "штуки",
  "штука",
  "ломтиков",
  "ломтика",
  "ломтик",
  "пучков",
  "пучка",
  "пучок",
  "банки",
  "банка",
  "tbsp.",
  "tbsp",
  "tbs.",
  "tbs",
  "tsp.",
  "tsp",
  "fl oz",
  "oz.",
  "oz",
  "lbs.",
  "lbs",
  "lb.",
  "lb",
  "pcs.",
  "pcs",
  "pkg.",
  "pkg",
  "stk.",
  "stk",
  "pr.",
  "pr",
  "c.",
  "c",
  "el",
  "tl",
  "kg",
  "mg",
  "ml",
  "cl",
  "dl",
  "qt",
  "pt",
  "g",
  "l",
  "граммов",
  "грамма",
  "грамм",
  "килограммов",
  "килограмма",
  "килограмм",
  "миллилитров",
  "миллилитра",
  "миллилитр",
  "литров",
  "литра",
  "литр",
  "ст. л.",
  "ст.л.",
  "ч. л.",
  "ч.л.",
  "кг",
  "мг",
  "мл",
  "гр.",
  "гр",
  "шт.",
  "шт",
  "г",
  "л",
].sort((a, b) => b.length - a.length);

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
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();

  return values.reduce<string[]>((result, value) => {
    const normalized = normalizeText(value);
    const key = normalized.toLocaleLowerCase();

    if (!normalized || seen.has(key)) return result;

    seen.add(key);
    result.push(normalized);
    return result;
  }, []);
}

function asRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return value as Record<string, JsonValue>;
}

function firstString(...values: JsonValue[]): string {
  for (const value of values) {
    if (typeof value === "string") {
      const normalized = normalizeText(value);
      if (normalized) return normalized;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = firstString(item);
        if (nested) return nested;
      }
    }

    const record = asRecord(value);
    if (record) {
      const nested: string = firstString(record.text ?? null, record.name ?? null, record.value ?? null);
      if (nested) return nested;
    }
  }

  return "";
}

function collectStrings(value: JsonValue): string[] {
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
  }

  if (typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectStrings);

  const record = asRecord(value);
  if (!record) return [];

  return collectStrings(
    record.text ?? record.name ?? record.value ?? record["@value"] ?? record.item ?? null,
  );
}

function cleanJsonLd(raw: string) {
  return raw
    .replace(/^\uFEFF/, "")
    .replace(/^\s*<!--/, "")
    .replace(/-->\s*$/, "")
    .replace(/^\s*\/\/<!\[CDATA\[/, "")
    .replace(/\/\/\]\]>\s*$/, "")
    .trim();
}

function splitTopLevelJsonValues(raw: string) {
  const chunks: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{" || character === "[") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (character === "}" || character === "]") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        chunks.push(raw.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return chunks;
}

function parseJsonLdText(rawValue: string): JsonValue[] {
  const raw = cleanJsonLd(rawValue).replace(/;\s*$/, "");
  if (!raw) return [];

  try {
    return [JSON.parse(raw) as JsonValue];
  } catch {
    return splitTopLevelJsonValues(raw).flatMap((candidate) => {
      try {
        return [JSON.parse(candidate) as JsonValue];
      } catch {
        return [];
      }
    });
  }
}

function parseJsonLdCandidates($: cheerio.CheerioAPI) {
  return $('script[type*="ld+json" i]')
    .toArray()
    .flatMap((element) => parseJsonLdText($(element).contents().text()));
}

function isRecipeType(value: string) {
  const normalized = value.toLowerCase().split(/[\/#]/).pop();
  return normalized === "recipe";
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
    .some(isRecipeType);

  if (hasRecipeType) {
    return [objectNode];
  }

  return [
    ...flattenJsonLdRecipes(objectNode["@graph"] ?? null),
    ...flattenJsonLdRecipes(objectNode.item ?? null),
    ...flattenJsonLdRecipes(objectNode.mainEntity ?? null),
    ...flattenJsonLdRecipes(objectNode.itemListElement ?? null),
  ];
}

function splitInstructionString(value: string) {
  const withLineBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|li|ol|p|section)>/gi, "\n");
  const lines = withLineBreaks
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/\s+(?=(?:step\s+)?\d{1,2}[.)]\s+)/i))
    .map((line) =>
      normalizeText(line).replace(/^(?:(?:step|schritt|шаг)\s*)?\d{1,2}[.):.-]\s*/iu, ""),
    )
    .filter(Boolean);

  return uniqueStrings(lines);
}

function parseInstructionText(value: JsonValue): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    return splitInstructionString(value);
  }

  if (Array.isArray(value)) {
    return value.flatMap(parseInstructionText);
  }

  const record = asRecord(value);
  if (!record) return [];

  const nested = [
    ...parseInstructionText(record.itemListElement ?? null),
    ...parseInstructionText(record.item ?? null),
  ];

  if (nested.length > 0) return nested;

  return parseInstructionText(record.text ?? record.name ?? null);
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

function isIngredientHeading(value: string) {
  const normalized = normalizeText(value).toLocaleLowerCase();

  return (
    /^(?:ingredients?|zutaten|ingrédients?|ingredientes?|ингредиенты|состав)\s*:?$/u.test(normalized) ||
    /(?:ingredient|product|продукт|ингредиент).*(?:amount|quantity|menge|количеств)/u.test(normalized)
  );
}

function isPlausibleIngredientLine(value: string) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > 220 || isIngredientHeading(normalized)) return false;
  if (normalized.split(/\s+/).length > 24) return false;
  if (scoreIngredientLine(normalized) > 0) return true;

  return normalized.length <= 100 && !/[.!?]$/.test(normalized);
}

function startsWithUnit(value: string, unit: string) {
  const normalizedValue = value.toLocaleLowerCase();
  const normalizedUnit = unit.toLocaleLowerCase();

  return (
    normalizedValue === normalizedUnit ||
    (normalizedValue.startsWith(normalizedUnit) &&
      /[\s,]/.test(normalizedValue.charAt(normalizedUnit.length)))
  );
}

function splitUnitAndName(value: string) {
  const normalized = normalizeText(value);
  const matchedUnit = UNIT_NAMES.find((unit) => startsWithUnit(normalized, unit));

  if (!matchedUnit) return { unit: "", name: normalized };

  const unit = normalized.slice(0, matchedUnit.length);
  const name = normalizeText(normalized.slice(matchedUnit.length).replace(/^,/, ""));

  return {
    unit,
    name,
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
  const normalized = normalizeText(value)
    .replace(/^(?:[•·▪◦]\s*|[-–—]\s+)/, "")
    .trim();
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
  return createIngredients(parseIngredientText(value));
}

function parseIngredientText(value: JsonValue): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(parseIngredientText);
  }

  const record = asRecord(value);
  if (!record) return [];

  const ingredientName = firstString(
    record.ingredient ?? null,
    record.food ?? null,
    record.name ?? null,
  );
  const amount = collectStrings(record.amount ?? record.quantity ?? null).at(0) ?? "";
  const unit = firstString(record.unitText ?? record.unit ?? null);

  if (ingredientName && (amount || unit)) {
    return [normalizeText([amount, unit, ingredientName].filter(Boolean).join(" "))];
  }

  const direct = firstString(record.text ?? null, record.name ?? null, record.value ?? null);
  return direct
    ? [direct]
    : parseIngredientText(
        record.item ?? record.itemListElement ?? record["@list"] ?? null,
      );
}

function parseSteps(value: JsonValue): Step[] {
  return createSteps(parseInstructionText(value));
}

function createIngredients(lines: string[]) {
  return uniqueStrings(lines)
    .slice(0, MAX_INGREDIENTS)
    .map(parseIngredientLine)
    .map((ingredient) => ({
      ...ingredient,
      name: truncateText(ingredient.name, 200),
      amount: ingredient.amount ? truncateText(ingredient.amount, 50) : undefined,
      unit: ingredient.unit ? truncateText(ingredient.unit, 50) : "",
    }))
    .filter((ingredient) => ingredient.name);
}

function createSteps(lines: string[]) {
  return uniqueStrings(lines.flatMap(splitInstructionString))
    .filter((text) => /[\p{L}\p{N}]/u.test(text))
    .slice(0, MAX_STEPS)
    .map((text) => ({
      id: createId(),
      text: truncateText(text, 5_000),
    }));
}

function extractMetaContent($: cheerio.CheerioAPI, attr: string, value: string) {
  const content = $(`meta[${attr}="${value}" i]`).first().attr("content");
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

const RECIPE_SCOPE_SELECTOR = [
  '[itemscope][itemtype*="schema.org/Recipe" i]',
  '[typeof~="Recipe" i]',
].join(", ");

function selectRecipePropertyNodes($: cheerio.CheerioAPI, selector: string) {
  const scopes = $(RECIPE_SCOPE_SELECTOR).toArray();
  if (scopes.length === 0) return $(selector).toArray();

  return scopes.flatMap((scope) => [
    ...($(scope).is(selector) ? [scope] : []),
    ...$(scope).find(selector).toArray(),
  ]);
}

function extractRecipePropertyTexts($: cheerio.CheerioAPI, selector: string) {
  return uniqueStrings(
    selectRecipePropertyNodes($, selector).map((element) => extractTextOrContent($, element)),
  );
}

function extractTitleFallback($: cheerio.CheerioAPI) {
  return (
    extractMetaContent($, "property", "og:title") ||
    extractRecipePropertyTexts($, '[itemprop~="name"], [property~="name"]').at(0) ||
    normalizeText($("h1").first().text()) ||
    extractItempropTexts($, '[itemprop~="name"], [property~="name"]').at(0) ||
    normalizeText($("title").first().text())
  );
}

function extractDescriptionFallback($: cheerio.CheerioAPI) {
  return (
    extractRecipePropertyTexts(
      $,
      '[itemprop~="description"], [property~="description"]',
    ).at(0) ||
    extractMetaContent($, "property", "og:description") ||
    extractMetaContent($, "name", "description") ||
    normalizeText($("article p, main p").first().text())
  );
}

function truncateText(value: string, maxLength: number) {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeEnd = lastSpace > maxLength * 0.75 ? lastSpace : truncated.length;

  return `${truncated.slice(0, safeEnd).trimEnd()}…`;
}

function findImageValue(value: JsonValue): string {
  if (typeof value === "string") return normalizeText(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findImageValue(item);
      if (candidate) return candidate;
    }
    return "";
  }

  const record = asRecord(value);
  if (!record) return "";

  return firstString(
    record.url ?? null,
    record.contentUrl ?? null,
    record.thumbnailUrl ?? null,
  );
}

function resolveHttpUrl(value: string, sourceUrl: string) {
  if (!value) return "";

  try {
    const resolved = new URL(value, sourceUrl);
    if (!["http:", "https:"].includes(resolved.protocol)) return "";
    if (resolved.username || resolved.password) return "";
    return resolved.toString();
  } catch {
    return "";
  }
}

function extractImageUrl(
  $: cheerio.CheerioAPI,
  recipe: Record<string, JsonValue> | undefined,
  sourceUrl: string,
) {
  const microdataImage = selectRecipePropertyNodes($, '[itemprop~="image"], [property~="image"]')
    .map((element) =>
      $(element).attr("content") ??
      $(element).attr("src") ??
      $(element).attr("href") ??
      $(element).find("img").first().attr("src") ??
      "",
    )
    .find(Boolean) ?? "";
  const candidates = [
    findImageValue(recipe?.image ?? null),
    extractMetaContent($, "property", "og:image"),
    extractMetaContent($, "name", "twitter:image"),
    microdataImage,
    $('article img, main img').first().attr("src") ?? "",
  ];

  for (const candidate of candidates) {
    const resolved = resolveHttpUrl(candidate, sourceUrl);
    if (resolved && resolved.length <= 2_048) return resolved;
  }

  return undefined;
}

function parseIsoDurationMinutes(raw: string) {
  const isoMatch = raw.match(
    /^P(?:(\d+(?:[.,]\d+)?)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?)?$/i,
  );

  if (!isoMatch) return null;

  const days = Number((isoMatch[1] ?? "0").replace(",", "."));
  const hours = Number((isoMatch[2] ?? "0").replace(",", "."));
  const minutes = Number((isoMatch[3] ?? "0").replace(",", "."));

  return days * 24 * 60 + hours * 60 + minutes;
}

function formatDurationMinutes(value: number) {
  const totalMinutes = Math.round(value * 100) / 100;
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingAfterDays = totalMinutes - days * 24 * 60;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = Math.round((remainingAfterDays - hours * 60) * 100) / 100;
  const parts = [
    days ? `${days} d` : "",
    hours ? `${hours} hr` : "",
    minutes ? `${minutes} min` : "",
  ].filter(Boolean);

  return parts.join(" ") || undefined;
}

function formatDuration(value: JsonValue) {
  const raw = collectStrings(value).at(0) ?? "";
  if (!raw) return undefined;

  const minutes = parseIsoDurationMinutes(raw);
  return minutes === null ? truncateText(raw, 40) : formatDurationMinutes(minutes);
}

function combineDurations(...values: JsonValue[]) {
  const rawDurations = values
    .map((value) => collectStrings(value).at(0) ?? "")
    .filter(Boolean);
  if (rawDurations.length === 0) return undefined;

  const durations = rawDurations.map(parseIsoDurationMinutes);
  const validDurations = durations.filter(
    (duration): duration is number => duration !== null,
  );
  if (validDurations.length !== durations.length) return undefined;

  return formatDurationMinutes(
    validDurations.reduce((total, duration) => total + duration, 0),
  );
}

function formatServings(value: JsonValue) {
  const raw = collectStrings(value).at(0) ?? "";
  if (!raw) return undefined;

  return /^\d+(?:[.,]\d+)?$/.test(raw) ? `${raw} servings` : truncateText(raw, 40);
}

function extractIngredientsFromMicrodata($: cheerio.CheerioAPI) {
  return createIngredients(
    extractRecipePropertyTexts(
      $,
      [
        '[itemprop~="recipeIngredient"]',
        '[itemprop~="ingredients"]',
        '[property~="recipeIngredient"]',
        '[property~="ingredients"]',
      ].join(", "),
    ),
  );
}

function extractStepsFromMicrodata($: cheerio.CheerioAPI) {
  const instructionNodes = selectRecipePropertyNodes(
    $,
    '[itemprop~="recipeInstructions"], [property~="recipeInstructions"]',
  );
  const nested = uniqueStrings(
    instructionNodes.flatMap((element) => {
      const childTexts = $(element)
        .find('[itemprop~="text"], [itemprop~="name"], [property~="text"], [property~="name"], li, p')
        .toArray()
        .map((child) => extractTextOrContent($, child));

      return childTexts.length > 0 ? childTexts : [extractTextOrContent($, element)];
    }),
  );

  return createSteps(nested);
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
  const pairedLines = extractPairedIngredientLines($);
  if (pairedLines.length >= 2) {
    return createIngredients(pairedLines);
  }

  const tableBlock = extractIngredientTableBlock($);
  if (tableBlock) {
    return createIngredients(tableBlock.lines);
  }

  const hintedBlock = extractHintedIngredientBlock($);
  if (hintedBlock) {
    return createIngredients(hintedBlock.lines);
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

  return bestBlock ? createIngredients(bestBlock.lines) : [];
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

const INGREDIENT_ELEMENT_HINTS = [
  "ingredient",
  "zutat",
  "ingrédient",
  "ingrediente",
  "ингредиент",
  "состав",
];
const INGREDIENT_QUANTITY_HINTS = ["quantity", "amount", "measure", "menge", "qty"];
const INGREDIENT_NAME_HINTS = [
  "ingredient-name",
  "ingredient__name",
  "ingredient-title",
  "ingredient__title",
  "food-name",
  "item-name",
  "title",
  "name",
];

function elementsWithHintsWithin(
  $: cheerio.CheerioAPI,
  element: AnyNode,
  hints: string[],
) {
  return $(element)
    .find("*")
    .toArray()
    .filter((child) => hasAnyHint(getElementHints($, child), hints));
}

function extractPairedIngredientLines($: cheerio.CheerioAPI) {
  const pairedItems = new Set<AnyNode>();
  const lines: string[] = [];
  const quantityElements = $("article *, main *, [role='main'] *, body *")
    .toArray()
    .filter((element) =>
      hasAnyHint(getElementHints($, element), INGREDIENT_QUANTITY_HINTS),
    );

  for (const quantityElement of quantityElements) {
    const isInIngredientContext = [
      quantityElement,
      ...$(quantityElement).parents().toArray(),
    ].some((element) =>
      hasAnyHint(getElementHints($, element), INGREDIENT_ELEMENT_HINTS),
    );

    if (!isInIngredientContext) continue;

    let candidate = $(quantityElement).parent().get(0);

    for (let depth = 0; candidate && depth < 6; depth += 1) {
      const quantityFields = elementsWithHintsWithin(
        $,
        candidate,
        INGREDIENT_QUANTITY_HINTS,
      );
      const nameFields = elementsWithHintsWithin($, candidate, INGREDIENT_NAME_HINTS)
        .filter(
          (element) =>
            !hasAnyHint(getElementHints($, element), INGREDIENT_QUANTITY_HINTS),
        )
        .filter((element) => normalizeText($(element).text()));

      if (quantityFields.length === 1 && nameFields.length > 0) {
        if (pairedItems.has(candidate)) break;

        const quantity = normalizeText($(quantityFields[0]).text());
        const name = normalizeText($(nameFields[0]).text());

        if (quantity && name && isPlausibleIngredientLine(`${quantity} ${name}`)) {
          pairedItems.add(candidate);
          lines.push(`${quantity} ${name}`);
        }
        break;
      }

      candidate = $(candidate).parent().get(0);
    }
  }

  return uniqueStrings(lines);
}

function extractHintedIngredientBlock($: cheerio.CheerioAPI) {
  return $("article *, main *, [role='main'] *, body *")
    .toArray()
    .filter((element) =>
      hasAnyHint(getElementHints($, element), INGREDIENT_ELEMENT_HINTS),
    )
    .map((element): ScoredBlock => {
      const childLines = uniqueStrings(
        $(element)
          .find("li, p, tr, [itemprop~='recipeIngredient'], [property~='recipeIngredient']")
          .toArray()
          .map((child) => $(child).text()),
      );
      const lines = childLines.length > 0 ? childLines : [$(element).text()];
      const ingredientLines = lines.filter(isPlausibleIngredientLine);

      return {
        lines: ingredientLines,
        score:
          lines.length > 0
            ? ingredientLines.reduce(
                (total, line) => total + Math.max(scoreIngredientLine(line), 0.4),
                0,
              ) / lines.length
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
          .map((row) => {
            const cells = $(row)
              .children("th, td")
              .toArray()
              .map((cell) => normalizeText($(cell).text()))
              .filter(Boolean);

            return cells.length >= 2 ? cells.join(" - ") : $(row).text();
          }),
      );
      const ingredientLines = lines.filter(
        (line) => !isIngredientHeading(line) && line.length <= 220 && scoreIngredientLine(line) > 0,
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
    return createSteps(hintedBlock.lines);
  }

  const repeatedBlock = extractRepeatedTextBlock($);
  if (repeatedBlock) {
    return createSteps(repeatedBlock.lines);
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

  return bestBlock ? createSteps(bestBlock.lines) : [];
}

function isStepHeading(value: string) {
  return /^(?:instructions?|directions?|method|preparation|steps?|zubereitung|anleitung|приготовление|инструкции|шаги)\s*:?$/iu.test(
    normalizeText(value),
  );
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
        "préparation",
        "preparacion",
        "preparación",
        "procedimiento",
        "приготов",
        "инструк",
        "шаг",
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
      const stepLines = lines.filter((line) => {
        const normalized = normalizeText(line);
        return normalized.length >= 8 && !isStepHeading(normalized);
      });

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

const COLLECTION_SUGGESTIONS = [
  {
    name: "Breakfast",
    hints: ["breakfast", "brunch", "frühstück", "petit déjeuner", "завтрак"],
  },
  {
    name: "Lunch",
    hints: ["lunch", "mittagessen", "déjeuner", "almuerzo", "обед"],
  },
  {
    name: "Dinner",
    hints: [
      "dinner",
      "supper",
      "main course",
      "main dish",
      "abendessen",
      "hauptgericht",
      "ужин",
      "основное блюдо",
    ],
  },
  {
    name: "Snacks",
    hints: [
      "snack",
      "dessert",
      "cake",
      "kuchen",
      "torte",
      "pastry",
      "appetizer",
      "appetiser",
      "starter",
      "vorspeise",
      "закуска",
      "десерт",
      "выпечка",
    ],
  },
] as const;

const COLLECTION_HINT_TAGS = new Set<string>(
  COLLECTION_SUGGESTIONS.flatMap((suggestion) => suggestion.hints),
);

function parseSuggestedCollection(...values: JsonValue[]) {
  for (const value of values) {
    for (const categoryText of collectStrings(value)) {
      const normalized = categoryText.toLocaleLowerCase();
      for (const suggestion of COLLECTION_SUGGESTIONS) {
        if (suggestion.hints.some((hint) => normalized.includes(hint))) {
          return suggestion.name;
        }
      }
    }
  }

  return null;
}

function parseTags(value: JsonValue) {
  const candidates = collectStrings(value).flatMap((entry) => entry.split(/[,;|]/));
  const seen = new Set<string>();

  return candidates
    .map(normalizeText)
    .filter((tag) => tag.length > 0 && tag.length <= 60)
    .filter((tag) => !COLLECTION_HINT_TAGS.has(tag.toLocaleLowerCase()))
    .filter((tag) => {
      const normalized = tag.toLocaleLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 20);
}

function scoreJsonLdRecipe(recipe: Record<string, JsonValue>) {
  const ingredients = parseIngredients(recipe.recipeIngredient ?? null);
  const steps = parseSteps(recipe.recipeInstructions ?? null);
  const title = firstString(recipe.name ?? null);
  const description = firstString(recipe.description ?? null);

  return (
    ingredients.length * 3 +
    steps.length * 3 +
    (title ? 4 : 0) +
    (description ? 1 : 0)
  );
}

function selectBestJsonLdRecipe($: cheerio.CheerioAPI) {
  return parseJsonLdCandidates($)
    .flatMap(flattenJsonLdRecipes)
    .sort((a, b) => scoreJsonLdRecipe(b) - scoreJsonLdRecipe(a))
    .at(0);
}

export function buildImportedRecipe(html: string, sourceUrl: string): ImportedRecipePayload | null {
  const $ = cheerio.load(html);
  const recipe = selectBestJsonLdRecipe($);
  const imageUrl = extractImageUrl($, recipe, sourceUrl);
  const explicitTotalTime =
    recipe?.totalTime ??
    extractRecipePropertyTexts(
      $,
      '[itemprop~="totalTime"], [property~="totalTime"]',
    ).at(0) ??
    null;
  const prepTime =
    recipe?.prepTime ??
    extractRecipePropertyTexts(
      $,
      '[itemprop~="prepTime"], [property~="prepTime"]',
    ).at(0) ??
    null;
  const cookTime =
    recipe?.cookTime ??
    extractRecipePropertyTexts(
      $,
      '[itemprop~="cookTime"], [property~="cookTime"]',
    ).at(0) ??
    null;
  const totalTime =
    formatDuration(explicitTotalTime) ??
    combineDurations(prepTime, cookTime) ??
    formatDuration(cookTime ?? prepTime);
  const servings = formatServings(
    recipe?.recipeYield ??
      extractRecipePropertyTexts(
        $,
        '[itemprop~="recipeYield"], [property~="recipeYield"]',
      ).at(0) ??
      null,
  );

  $("script, style, noscript, svg").remove();

  const title = truncateText(
    firstString(recipe?.name ?? null) || extractTitleFallback($),
    MAX_TITLE_LENGTH,
  );
  const recipeDescription = firstString(recipe?.description ?? null);
  const fallbackDescription = extractDescriptionFallback($);
  const description = truncateText(
    recipeDescription && !isNoisyDescription(recipeDescription, title)
      ? recipeDescription
      : fallbackDescription && !isNoisyDescription(fallbackDescription, title)
        ? fallbackDescription
        : title,
    MAX_DESCRIPTION_LENGTH,
  );
  const ingredients = parseIngredients(recipe?.recipeIngredient ?? null);
  const steps = parseSteps(recipe?.recipeInstructions ?? null);

  const fallbackIngredients =
    ingredients.length > 0 ? ingredients : extractIngredientsFromMicrodata($);
  const fallbackSteps = steps.length > 0 ? steps : extractStepsFromMicrodata($);
  const finalIngredients =
    fallbackIngredients.length > 0 ? fallbackIngredients : extractIngredientsFallback($);
  const finalSteps = fallbackSteps.length > 0 ? fallbackSteps : extractStepsFallback($);

  if (!title || (finalIngredients.length === 0 && finalSteps.length === 0)) {
    return null;
  }

  return {
    title,
    description,
    suggestedCollection:
      parseSuggestedCollection(recipe?.recipeCategory ?? null, recipe?.keywords ?? null) ??
      undefined,
    ingredients: finalIngredients,
    steps: finalSteps,
    tags: parseTags(recipe?.keywords ?? null),
    sourceUrl,
    imageUrl,
    totalTime,
    servings,
  };
}
