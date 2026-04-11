import type { Session } from "@supabase/supabase-js";

import { env } from "@/src/lib/env";
export { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";

export const SUPABASE_AUTH_STORAGE_KEY = `sb-${new URL(env.supabaseUrl).hostname.split(".")[0]}-auth-token`;
export const SUPABASE_AUTH_USER_STORAGE_KEY = `${SUPABASE_AUTH_STORAGE_KEY}-user`;

type MinimalStoredSession = Pick<
  Session,
  "access_token" | "refresh_token" | "expires_at" | "expires_in" | "token_type"
> & {
  provider_token?: string | null;
  provider_refresh_token?: string | null;
};

function getCookieAttributes(maxAge?: number) {
  const attributes = ["Path=/", "SameSite=Lax"];

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  if (typeof maxAge === "number") {
    attributes.push(`Max-Age=${maxAge}`);
  }

  return attributes.join("; ");
}

function readCookieValue(key: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(key)}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(prefix.length));
}

function writeCookieValue(key: string, value: string, maxAge?: number) {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; ${getCookieAttributes(maxAge)}`;
}

function removeCookieValue(key: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(key)}=; ${getCookieAttributes(0)}`;
}

function stripStoredSession(rawValue: string) {
  try {
    const parsed = JSON.parse(rawValue) as Session;

    const minimalSession: MinimalStoredSession = {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
      expires_in: parsed.expires_in,
      token_type: parsed.token_type,
      provider_token: parsed.provider_token,
      provider_refresh_token: parsed.provider_refresh_token,
    };

    return JSON.stringify(minimalSession);
  } catch {
    return rawValue;
  }
}

export const cookieSessionStorage = {
  getItem(key: string) {
    return readCookieValue(key);
  },
  setItem(key: string, value: string) {
    const normalizedValue = key === SUPABASE_AUTH_STORAGE_KEY ? stripStoredSession(value) : value;
    writeCookieValue(key, normalizedValue, 60 * 60 * 24 * 30);
  },
  removeItem(key: string) {
    removeCookieValue(key);
  },
};

export const browserUserStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export function getAuthRedirectUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathname}`;
  }

  return `${env.siteUrl}${pathname}`;
}
