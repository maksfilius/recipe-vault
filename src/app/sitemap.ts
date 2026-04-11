import type { MetadataRoute } from "next";

import { env } from "@/src/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${env.siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${env.siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${env.siteUrl}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}

