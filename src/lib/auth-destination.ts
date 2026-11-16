// Where login, registration and password reset may send the user afterwards: only the dashboard
// and settings, with the query parameters the dashboard understands. Anything else is /dashboard.
export function getImportAuthDestination(next: string | null | undefined) {
  if (!next || next.length > 4_096 || !next.startsWith("/") || next.startsWith("//") || next.includes("#")) return "/dashboard";
  try {
    // Any base works: it only resolves the relative path, and the origin check rejects paths that escape it.
    const base = "https://app.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return "/dashboard";
    if (url.pathname === "/dashboard/favorites") return "/dashboard";
    if (url.pathname === "/dashboard/settings") return url.search ? "/dashboard" : url.pathname;
    if (url.pathname !== "/dashboard") return "/dashboard";
    const allowedParams = new Set(["q", "collections", "tags", "add", "url"]);
    if ([...url.searchParams.keys()].some((key) => !allowedParams.has(key) || url.searchParams.getAll(key).length > 1)) return "/dashboard";
    if (url.searchParams.has("add") && !["manual", "select"].includes(url.searchParams.get("add") ?? "")) return "/dashboard";
    return `${url.pathname}${url.search}`;
  } catch { return "/dashboard"; }
}
