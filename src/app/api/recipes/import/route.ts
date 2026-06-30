import { NextResponse } from "next/server";

import { buildImportedRecipe, decodeRecipeHtml } from "@/src/lib/recipe-import-parser";

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
        "user-agent": "Mozilla/5.0 (compatible; KeepAndCookBot/1.0; +https://keepandcook.com)",
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
    const importedRecipe = buildImportedRecipe(
      decodeRecipeHtml(htmlBytes, contentType),
      parsedUrl.toString(),
    );

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
