import { NextResponse } from "next/server";

import { consumeRateLimit, getClientAddress } from "@/src/lib/rate-limit";
import { buildImportedRecipe, decodeRecipeHtml } from "@/src/lib/recipe-import-parser";
import {
  prepareRecipeImage,
  recipeImageToDataUrl,
  storePreparedRecipeImage,
} from "@/src/lib/recipe-image";
import {
  assertPublicRecipeUrl,
  normalizeRecipeImportUrl,
} from "@/src/lib/recipe-import-url";
import { createServerSupabaseClient } from "@/src/lib/supabase-server";

export const runtime = "nodejs";

const MAX_HTML_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 12_000;
const IMAGE_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
// Anonymous imports are keyed by address, so the limit has to leave room for
// several visitors sharing one carrier-grade NAT address.
const ANONYMOUS_IMPORT_LIMIT = 8;
const AUTHENTICATED_IMPORT_LIMIT = 30;

class RecipeImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function jsonError(message: string, status: number, headers: HeadersInit = {}) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

async function readLimitedResponse(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_BYTES) {
    throw new RecipeImportError("This recipe page is too large to import.", 413);
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalLength += value.byteLength;
    if (totalLength > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new RecipeImportError("This recipe page is too large to import.", 413);
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

async function fetchRecipePage(initialUrl: URL, signal: AbortSignal) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    try {
      await assertPublicRecipeUrl(currentUrl);
    } catch {
      throw new RecipeImportError("This URL can’t be imported.", 400);
    }

    const response = await fetch(currentUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; KeepAndCookBot/1.0; +https://keepandcook.com)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en,de,ru;q=0.8,*;q=0.5",
      },
      cache: "no-store",
      redirect: "manual",
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();

      if (!location) {
        throw new RecipeImportError("The recipe page returned an invalid redirect.", 400);
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new RecipeImportError("The recipe page redirected too many times.", 400);
      }

      try {
        currentUrl = normalizeRecipeImportUrl(new URL(location, currentUrl).toString());
      } catch {
        throw new RecipeImportError("The recipe page redirected to an invalid URL.", 400);
      }
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new RecipeImportError("The recipe page redirected too many times.", 400);
}

async function getRequestUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { supabase, user };
  } catch {
    return { supabase: null, user: null };
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const rawUrl = body?.url?.trim();

  if (!rawUrl) {
    return jsonError("Paste a recipe URL first.", 400);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = normalizeRecipeImportUrl(rawUrl);
  } catch {
    return jsonError("Enter a valid recipe URL.", 400);
  }

  const { supabase, user } = await getRequestUser();
  const rateLimit = consumeRateLimit(
    user ? `import:user:${user.id}` : `import:ip:${getClientAddress(request)}`,
    {
      limit: user ? AUTHENTICATED_IMPORT_LIMIT : ANONYMOUS_IMPORT_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    },
  );

  if (!rateLimit.allowed) {
    return jsonError(
      user
        ? "Too many imports right now. Please try again shortly."
        : "Too many imports from this network. Sign in or try again shortly.",
      429,
      { "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  try {
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const { response, finalUrl } = await fetchRecipePage(parsedUrl, signal);

    if (!response.ok) {
      if (response.status === 404) {
        return jsonError("This recipe page could not be found.", 404);
      }

      if (response.status === 401 || response.status === 403) {
        return jsonError("This website blocked the recipe import.", 400);
      }

      return jsonError(`Could not fetch this page (${response.status}).`, 400);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(contentType.trim())) {
      await response.body?.cancel();
      return jsonError("This URL did not return a recipe page.", 400);
    }

    let imageDropReason: string | undefined;
    const htmlBytes = await readLimitedResponse(response);
    const importedRecipe = buildImportedRecipe(
      decodeRecipeHtml(htmlBytes, contentType),
      finalUrl.toString(),
    );

    if (!importedRecipe) {
      return jsonError("We couldn’t find a complete recipe on this page.", 422);
    }

    if (importedRecipe.imageUrl) {
      try {
        const imageUrl = normalizeRecipeImportUrl(importedRecipe.imageUrl);
        if (imageUrl.protocol !== "https:") throw new Error("Only secure preview images are supported.");
        await assertPublicRecipeUrl(imageUrl);
        const imageBytes = await prepareRecipeImage(
          imageUrl.toString(),
          AbortSignal.timeout(IMAGE_TIMEOUT_MS),
          user ? "stored" : "preview",
        );

        if (user && supabase) {
          try {
            importedRecipe.imageUrl = await storePreparedRecipeImage(
              supabase,
              user.id,
              imageBytes,
            );
          } catch {
            importedRecipe.imageUrl = recipeImageToDataUrl(imageBytes);
          }
        } else {
          importedRecipe.imageUrl = recipeImageToDataUrl(imageBytes);
        }
      } catch (imageError) {
        // A recipe is still worth importing without its picture, but the reason
        // has to be visible: a silently dropped image looks like a parser bug.
        const reason =
          imageError instanceof Error ? imageError.message : String(imageError);

        console.warn("Recipe image dropped", {
          sourceUrl: finalUrl.toString(),
          imageUrl: importedRecipe.imageUrl,
          reason,
        });

        delete importedRecipe.imageUrl;
        if (process.env.NODE_ENV !== "production") imageDropReason = reason;
      }
    }

    return NextResponse.json({ ...importedRecipe, imageDropReason }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RecipeImportError) {
      return jsonError(error.message, error.status);
    }

    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      return jsonError("The recipe website took too long to respond.", 504);
    }

    return jsonError("We couldn’t reach this recipe website.", 502);
  }
}
