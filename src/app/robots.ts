import type { MetadataRoute } from "next";

import { env } from "@/src/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/dashboard/*"],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}

