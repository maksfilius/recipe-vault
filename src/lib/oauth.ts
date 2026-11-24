import { getImportAuthDestination } from "./auth-destination.ts";

// Google sign-in and email confirmation (Supabase PKCE). Google returns through Supabase, and the link in
// the confirmation email goes through Supabase's verify endpoint, to /auth/callback, which exchanges the
// code for a session. Email links carry flow=email so failures explain the right thing.
export const OAUTH_CALLBACK_PATH = "/auth/callback";

export type OAuthErrorCode = "cancelled" | "failed" | "unavailable" | "offline" | "confirmed" | "link_expired";
export const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  cancelled: "Google sign-in was cancelled. Try again, or use your email and password.",
  failed: "We couldn’t sign you in with Google. Try again from this browser, or use your email and password.",
  unavailable: "Google sign-in isn’t available right now. Use your email and password instead.",
  offline: "Could not connect. Check your connection and try again.",
  // The address is confirmed, but this browser could not finish signing in (for example the link was
  // opened in a different browser than the one used to register).
  confirmed: "Your email is confirmed. Sign in to continue.",
  link_expired: "This confirmation link has expired or was already used. Sign in, or register again to get a new link.",
};

export function getOAuthErrorCode(value: string | null): OAuthErrorCode | null {
  return value && Object.hasOwn(OAUTH_ERROR_MESSAGES, value) ? value as OAuthErrorCode : null;
}

// Where Google or the confirmation email should come back to; `next` only carries a destination
// getImportAuthDestination allows.
export function getOAuthRedirectTo(origin: string, next: string | null | undefined, flow?: "email") {
  const destination = getImportAuthDestination(next);
  const params = new URLSearchParams();
  if (destination !== "/dashboard") params.set("next", destination);
  if (flow) params.set("flow", flow);
  return `${origin}${OAUTH_CALLBACK_PATH}${params.size ? `?${params}` : ""}`;
}

// Back to sign-in with a reason, keeping the destination.
export function getOAuthFailurePath(code: OAuthErrorCode, next: string | null | undefined) {
  const destination = getImportAuthDestination(next);
  const params = new URLSearchParams({ auth_error: code });
  if (destination !== "/dashboard") params.set("next", destination);
  return `/login?${params}`;
}

// Decides what the callback does with the query Supabase sent back: exchange a code, or explain a failure.
// Google's "Cancel" arrives as error=access_denied; an expired or reused email link as an error too.
// `failurePath` is where to go when the exchange itself fails.
export function readOAuthCallback(searchParams: URLSearchParams):
  | { kind: "exchange"; code: string; destination: string; failurePath: string }
  | { kind: "error"; path: string } {
  const next = searchParams.get("next");
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const isEmail = searchParams.get("flow") === "email";
  if (error) return { kind: "error", path: getOAuthFailurePath(isEmail ? "link_expired" : error === "access_denied" ? "cancelled" : "failed", next) };
  if (!code || code.length > 512) return { kind: "error", path: getOAuthFailurePath(isEmail ? "link_expired" : "failed", next) };
  return { kind: "exchange", code, destination: getImportAuthDestination(next), failurePath: getOAuthFailurePath(isEmail ? "confirmed" : "failed", next) };
}
