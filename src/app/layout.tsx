import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { env } from "@/src/lib/env";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    "recipe vault",
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
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
