import { env } from "@/src/lib/env";

export { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";

export function getAuthRedirectUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathname}`;
  }

  return `${env.siteUrl}${pathname}`;
}
