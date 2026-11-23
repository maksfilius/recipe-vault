import type { MetadataRoute } from "next";

import { env } from "@/src/lib/env";

// Public pages only; the library and auth recovery screens are not search landing pages.
const pages: [path: string, changeFrequency: "weekly" | "monthly" | "yearly", priority: number][] = [
  ["", "weekly", 1],
  ["/chrome-extension", "monthly", 0.9],
  ["/install", "monthly", 0.8],
  ["/register", "monthly", 0.5],
  ["/login", "monthly", 0.4],
  ["/privacy", "yearly", 0.2],
  ["/terms", "yearly", 0.2],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${env.siteUrl}${path}`, lastModified: new Date(), changeFrequency, priority }));
}
