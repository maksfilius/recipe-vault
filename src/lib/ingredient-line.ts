import type { Ingredient } from "../types/recipe.ts";

const AMOUNT_PATTERN =
  String.raw`(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|[.,]\d+|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉])(?:\s*[-–]\s*(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|[.,]\d+|\d+\s*[¼½¾⅐-⅟↉]|\d+\s*\/\s*\d+|[¼½¾⅐-⅟↉]))?`;

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

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTrailingQuantity(value: string) {
  const match = normalizeText(value).match(new RegExp(`^(${AMOUNT_PATTERN})(?:\\s+(.+))?$`, "u"));
  if (!match) return null;

  return {
    amount: normalizeText(match[1]) || undefined,
    unit: normalizeText(match[2] ?? ""),
  };
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

