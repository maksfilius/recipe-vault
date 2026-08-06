import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

// Next reads this config before it loads `.env*`, so NEXT_PUBLIC_SUPABASE_URL is
// undefined here unless the environment already provides it (as hosting platforms
// do). Without this call the storage origin silently drops out of `img-src` and
// every stored recipe image is blocked by CSP in local development.
loadEnvConfig(process.cwd(), isDevelopment, { info: () => {}, error: () => {} });

const supabaseImageOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    // Last resort: keep stored images loadable rather than failing closed on a
    // misconfigured environment. Still far narrower than allowing all of https:.
    return "https://*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    const scriptSrc = isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              ["img-src 'self' data: blob:", supabaseImageOrigin].filter(Boolean).join(" "),
              "font-src 'self' data:",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
