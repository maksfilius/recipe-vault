// Cooking steps almost always say how long something takes ("simmer for 20
// minutes"). Finding those spans lets the cooking mode offer a one-tap timer
// instead of making someone leave the app to set one.

export type StepDuration = {
  /** Human label for the button, e.g. "20 min". */
  label: string;
  seconds: number;
};

const MIN_SECONDS = 5;
const MAX_SECONDS = 12 * 60 * 60;
const MAX_SUGGESTIONS = 3;

// Same language coverage as the import parser: English, German, Russian.
const UNIT_GROUPS: Array<{ multiplier: number; pattern: string }> = [
  {
    multiplier: 3600,
    pattern: "hours?|hrs?|h|stunden?|std\\.?|часов|часа|часу|час|ч",
  },
  {
    multiplier: 60,
    pattern: "minutes?|mins?|min\\.?|m|minuten?|минуты|минуту|минут|мин\\.?|м",
  },
  {
    multiplier: 1,
    pattern: "seconds?|secs?|sec\\.?|sekunden?|секунды|секунду|секунд|сек\\.?",
  },
];

const NUMBER = String.raw`\d{1,3}(?:[.,]\d{1,2})?`;

function buildPattern() {
  const units = UNIT_GROUPS.map(({ pattern }) => pattern).join("|");

  // A range keeps only its lower bound: checking the food early is safer than
  // late. The trailing guard stops "5 г" or "через" from matching a unit.
  return new RegExp(
    String.raw`(${NUMBER})\s*(?:[-–—]|\bto\b|\bдо\b)?\s*(?:${NUMBER})?\s*(${units})(?![\p{L}\d])`,
    "giu",
  );
}

function unitMultiplier(rawUnit: string) {
  const unit = rawUnit.toLocaleLowerCase();

  for (const { multiplier, pattern } of UNIT_GROUPS) {
    if (new RegExp(`^(?:${pattern})$`, "iu").test(unit)) return multiplier;
  }

  return null;
}

export function formatDurationLabel(seconds: number) {
  if (seconds < 60) return `${seconds} s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}

export function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainder)}`
    : `${minutes}:${pad(remainder)}`;
}

export function findStepDurations(text: string): StepDuration[] {
  if (!text) return [];

  const found: StepDuration[] = [];
  const seen = new Set<number>();

  for (const match of text.matchAll(buildPattern())) {
    const multiplier = unitMultiplier(match[2]);
    if (multiplier === null) continue;

    const amount = Number.parseFloat(match[1].replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const seconds = Math.round(amount * multiplier);
    if (seconds < MIN_SECONDS || seconds > MAX_SECONDS || seen.has(seconds)) continue;

    seen.add(seconds);
    found.push({ label: formatDurationLabel(seconds), seconds });

    if (found.length === MAX_SUGGESTIONS) break;
  }

  return found;
}
