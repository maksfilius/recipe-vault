import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { env } from "@/src/lib/env";
import {
  assertPublicRecipeUrl,
  normalizeRecipeImportUrl,
} from "@/src/lib/recipe-import-url";

export const RECIPE_IMAGE_BUCKET = "recipe-images";

const MAX_IMAGE_REDIRECTS = 4;
const MAX_IMAGE_INPUT_BYTES = 8 * 1024 * 1024;

// Decode cost scales with pixels, so this is what actually bounds CPU and
// memory. Keep it at sharp's original ceiling: lowering it silently rejects
// large-but-legitimate source photos, and anonymous cost is already bounded by
// the rate limiter plus the single-pass preview.
const MAX_IMAGE_PIXELS = 40_000_000;

// The storage bucket rejects anything above 2MB, so that is the only size at
// which dropping an image is better than keeping it.
const HARD_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

// Anonymous callers only ever get the cheap single-pass preview: one decode
// instead of three, so an unauthenticated request cannot cost much CPU. The
// per-preset output size is a target, not a requirement — see prepareRecipeImage.
const RECIPE_IMAGE_PRESETS = {
  preview: {
    targetOutputBytes: 320 * 1024,
    steps: [{ width: 960, quality: 68 }],
  },
  stored: {
    targetOutputBytes: 900 * 1024,
    steps: [
      { width: 1280, quality: 80 },
      { width: 960, quality: 68 },
      { width: 720, quality: 58 },
    ],
  },
} as const;

export type RecipeImagePreset = keyof typeof RECIPE_IMAGE_PRESETS;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export class RecipeImageError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

async function readLimitedResponse(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RecipeImageError("The recipe image is too large.", 413);
  }

  if (!response.body) {
    throw new RecipeImageError("The recipe image is empty.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalLength += value.byteLength;
    if (totalLength > maximumBytes) {
      await reader.cancel();
      throw new RecipeImageError("The recipe image is too large.", 413);
    }
    chunks.push(value);
  }

  if (totalLength === 0) {
    throw new RecipeImageError("The recipe image is empty.");
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalLength);
}

async function downloadRecipeImage(
  source: string,
  signal: AbortSignal,
  maxInputBytes: number,
) {
  let currentUrl: URL;

  try {
    currentUrl = normalizeRecipeImportUrl(source);
  } catch {
    throw new RecipeImageError("The recipe image URL is invalid.");
  }

  for (let redirectCount = 0; redirectCount <= MAX_IMAGE_REDIRECTS; redirectCount += 1) {
    try {
      await assertPublicRecipeUrl(currentUrl);
    } catch {
      throw new RecipeImageError("The recipe image URL is not public.");
    }

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        cache: "no-store",
        redirect: "manual",
        signal,
        headers: {
          accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8",
          "user-agent": "Mozilla/5.0 (compatible; KeepAndCookBot/1.0; +https://keepandcook.com)",
        },
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        throw error;
      }
      throw new RecipeImageError("The recipe image could not be downloaded.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();

      if (!location || redirectCount === MAX_IMAGE_REDIRECTS) {
        throw new RecipeImageError("The recipe image redirected too many times.");
      }

      try {
        currentUrl = normalizeRecipeImportUrl(new URL(location, currentUrl).toString());
      } catch {
        throw new RecipeImageError("The recipe image redirect is invalid.");
      }
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      throw new RecipeImageError("The recipe image could not be downloaded.");
    }

    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
      await response.body?.cancel();
      throw new RecipeImageError("The recipe image format is not supported.");
    }

    return readLimitedResponse(response, maxInputBytes);
  }

  throw new RecipeImageError("The recipe image redirected too many times.");
}

function decodeRecipeImageDataUrl(source: string, maxInputBytes: number) {
  const match = source.match(/^data:image\/webp;base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    throw new RecipeImageError("The recipe image data is invalid.");
  }

  const bytes = Buffer.from(match[1], "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > maxInputBytes) {
    throw new RecipeImageError("The recipe image is too large.", 413);
  }

  return bytes;
}

async function encodeWebp(bytes: Buffer, width: number, quality: number) {
  return sharp(bytes, {
    animated: false,
    failOn: "warning",
    limitInputPixels: MAX_IMAGE_PIXELS,
  })
    .rotate()
    .resize({
      width,
      height: width,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function prepareRecipeImage(
  source: string,
  signal: AbortSignal,
  preset: RecipeImagePreset = "stored",
) {
  const { targetOutputBytes, steps } = RECIPE_IMAGE_PRESETS[preset];
  const input = /^data:/i.test(source)
    ? decodeRecipeImageDataUrl(source, MAX_IMAGE_INPUT_BYTES)
    : await downloadRecipeImage(source, signal, MAX_IMAGE_INPUT_BYTES);

  let smallest: Buffer | null = null;

  for (const step of steps) {
    let encoded: Buffer;

    try {
      encoded = await encodeWebp(input, step.width, step.quality);
    } catch {
      throw new RecipeImageError("The recipe image could not be processed.");
    }

    if (encoded.byteLength <= targetOutputBytes) return encoded;
    if (!smallest || encoded.byteLength < smallest.byteLength) smallest = encoded;
  }

  // Missing the target only means the picture is heavier than preferred. Keep it
  // anyway: losing a recipe image is worse than serving a larger one.
  if (smallest && smallest.byteLength <= HARD_MAX_OUTPUT_BYTES) return smallest;

  throw new RecipeImageError(
    `The processed recipe image is too large (${smallest?.byteLength ?? 0} bytes).`,
    413,
  );
}

function getStoredImagePrefix() {
  return `${env.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${RECIPE_IMAGE_BUCKET}/`;
}

export function isStoredRecipeImageUrl(source: string, userId: string) {
  return source.startsWith(`${getStoredImagePrefix()}${userId}/`);
}

export function recipeImageToDataUrl(bytes: Buffer) {
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

export async function storePreparedRecipeImage(
  supabase: SupabaseClient,
  userId: string,
  bytes: Buffer,
) {
  const digest = createHash("sha256").update(bytes).digest("hex");
  const path = `${userId}/${digest}.webp`;
  const { error } = await supabase.storage
    .from(RECIPE_IMAGE_BUCKET)
    .upload(path, bytes, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    throw new RecipeImageError("The recipe image could not be saved.", 500);
  }

  const { data } = supabase.storage.from(RECIPE_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function storeRecipeImage(
  supabase: SupabaseClient,
  userId: string,
  source: string,
  signal: AbortSignal,
) {
  if (isStoredRecipeImageUrl(source, userId)) return source;

  const bytes = await prepareRecipeImage(source, signal, "stored");
  return storePreparedRecipeImage(supabase, userId, bytes);
}
