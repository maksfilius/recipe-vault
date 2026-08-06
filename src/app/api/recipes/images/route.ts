import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/src/lib/rate-limit";
import {
  RecipeImageError,
  storeRecipeImage,
} from "@/src/lib/recipe-image";
import { createServerSupabaseClient } from "@/src/lib/supabase-server";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 1_600_000;
const IMAGE_TIMEOUT_MS = 10_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const IMAGE_LIMIT = 40;

function jsonError(message: string, status: number, headers: HeadersInit = {}) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

async function readLimitedRequest(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RecipeImageError("The image request is too large.", 413);
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalLength += value.byteLength;
    if (totalLength > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RecipeImageError("The image request is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("Sign in to save recipe images.", 401);
    }

    const rateLimit = consumeRateLimit(`recipe-image:user:${user.id}`, {
      limit: IMAGE_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return jsonError("Too many recipe images right now. Please try again shortly.", 429, {
        "retry-after": String(rateLimit.retryAfterSeconds),
      });
    }

    const rawBody = await readLimitedRequest(request);
    const body = JSON.parse(rawBody) as { imageUrl?: unknown };
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      return jsonError("A recipe image is required.", 400);
    }

    const storedImageUrl = await storeRecipeImage(
      supabase,
      user.id,
      imageUrl,
      AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    );

    return NextResponse.json(
      { imageUrl: storedImageUrl },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RecipeImageError) {
      return jsonError(error.message, error.status);
    }

    if (error instanceof SyntaxError) {
      return jsonError("The image request is invalid.", 400);
    }

    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      return jsonError("The recipe image took too long to download.", 504);
    }

    return jsonError("The recipe image could not be saved.", 500);
  }
}
