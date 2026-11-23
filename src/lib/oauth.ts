import { getImportAuthDestination } from "./auth-destination.ts";

// Google sign-in (Supabase OAuth with PKCE). The browser starts it from /login or /register, Google
// returns through Supabase to /auth/callback, and the callback exchanges the code for a session.
export const OAUTH_CALLBACK_PATH = "/auth/callback";

export type OAuthErrorCode = "cancelled" | "failed" | "unavailable" | "offline";
export const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  cancelled: "Google sign-in was cancelled. Try again, or use your email and password.",
  failed: "We couldn’t sign you in with Google. Try again from this browser, or use your email and password.",
  unavailable: "Google sign-in isn’t available right now. Use your email and password instead.",
  offline: "Could not connect. Check your connection and try again.",
};

export function getOAuthErrorCode(value: string | null): OAuthErrorCode | null {
  return value && Object.hasOwn(OAUTH_ERROR_MESSAGES, value) ? value as OAuthErrorCode : null;
}

// Where Google should come back to; `next` only carries a destination getImportAuthDestination allows.
export function getOAuthRedirectTo(origin: string, next: string | null | undefined) {
  const destination = getImportAuthDestination(next);
  return `${origin}${OAUTH_CALLBACK_PATH}${destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`}`;
}

// Back to sign-in with a reason, keeping the destination.
export function getOAuthFailurePath(code: OAuthErrorCode, next: string | null | undefined) {
  const destination = getImportAuthDestination(next);
  const params = new URLSearchParams({ auth_error: code });
  if (destination !== "/dashboard") params.set("next", destination);
  return `/login?${params}`;
}

// Decides what the callback does with the query Supabase sent back: exchange a code, or explain a failure.
// Google's "Cancel" arrives as error=access_denied.
export function readOAuthCallback(searchParams: URLSearchParams):
  | { kind: "exchange"; code: string; destination: string }
  | { kind: "error"; path: string } {
  const next = searchParams.get("next");
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  if (error) return { kind: "error", path: getOAuthFailurePath(error === "access_denied" ? "cancelled" : "failed", next) };
  if (!code || code.length > 512) return { kind: "error", path: getOAuthFailurePath("failed", next) };
  return { kind: "exchange", code, destination: getImportAuthDestination(next) };
}
