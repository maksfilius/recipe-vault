export type SharedLinkKind = "site" | "youtube" | "tiktok" | "instagram";

// Android apps often put the link in `text` ("Look at this https://…"), so check every field in order.
export function findSharedUrl(fields: { url?: string | null; text?: string | null; title?: string | null }): string | null {
  for (const value of [fields.url, fields.text, fields.title]) {
    for (const match of value?.match(/https?:\/\/[^\s<>"']+/gi) ?? []) {
      try {
        const url = new URL(match.replace(/[.,;:!?)\]]+$/, ""));
        if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".")) return url.href;
      } catch { /* Try the next candidate. */ }
    }
  }
  return null;
}

export function getSharedLinkKind(value: string): SharedLinkKind {
  const host = new URL(value).hostname.toLowerCase();
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (is("youtube.com") || host === "youtu.be") return "youtube";
  if (is("tiktok.com")) return "tiktok";
  if (is("instagram.com")) return "instagram";
  return "site";
}
