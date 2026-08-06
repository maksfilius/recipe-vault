import type { Metadata, Viewport } from "next";

import PwaRegistration from "@/src/components/PwaRegistration";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // Not "black-translucent": that draws the status bar text in white over the
    // page, which is unreadable on the light theme's cream background, and it
    // puts the header underneath the clock. "default" keeps the bar opaque and
    // its text dark, and the web view starts below it.
    statusBarStyle: "default",
    title: env.productName,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#120915" },
  ],
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
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
