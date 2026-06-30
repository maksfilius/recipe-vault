import type { Metadata } from "next";

import ThemeInitializer from "@/src/components/ThemeInitializer";
import { env } from "@/src/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: env.productName,
    template: `%s | ${env.productName}`,
  },
  description: env.productDescription,
  applicationName: env.productName,
  keywords: [
    "recipe manager",
    "recipe organizer",
    "recipe storage app",
    "personal recipe app",
    "digital cookbook",
    "recipe dashboard",
    "meal planning recipes",
    "save recipes online",
    "personal cookbook",
    "kitchen dashboard",
  ],
  openGraph: {
    title: env.productName,
    description: env.productDescription,
    siteName: env.productName,
    type: "website",
    url: env.siteUrl,
    images: [
      {
        url: `${env.siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${env.productName} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: env.productName,
    description: env.productDescription,
    images: [`${env.siteUrl}/opengraph-image`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
