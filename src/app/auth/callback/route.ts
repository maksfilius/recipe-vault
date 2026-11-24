import type { NextRequest } from "next/server";

import { readOAuthCallback } from "@/src/lib/oauth";
import { createServerSupabaseClient } from "@/src/lib/supabase-server";

// A relative Location keeps the browser on the host it came back to, where the session cookie is set;
// request.url can name a different host behind a proxy.
const redirectTo = (path: string) => new Response(null, { status: 303, headers: { Location: path, "Cache-Control": "no-store" } });

// Google (through Supabase) and the sign-up confirmation link land here with ?code=…; the PKCE verifier
// is in the auth cookie the browser client set when sign-in or sign-up started, so the exchange works in
// any tab of that browser. Redirects stay on this site and on an allowed destination.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const callback = readOAuthCallback(searchParams);
  if (callback.kind === "error") return redirectTo(callback.path);

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
    if (!error) return redirectTo(callback.destination);
    console.error("Auth callback: code exchange failed", error.message);
  } catch (error) {
    console.error("Auth callback: code exchange failed", error);
  }
  return redirectTo(callback.failurePath);
}
