import type { Metadata } from "next";

import { env } from "./env";

// Public marketing pages: own title, description and canonical URL, while keeping the site-wide
// share image (a page's openGraph replaces the layout's instead of merging with it).
export function marketingMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const image = { url: `${env.siteUrl}/opengraph-image`, width: 1200, height: 630, alt: `${env.productName} preview` };
  return {
    metadataBase: new URL(env.siteUrl),
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: env.productName, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
