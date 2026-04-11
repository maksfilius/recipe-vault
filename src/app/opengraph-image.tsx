import { ImageResponse } from "next/og";

import { env } from "@/src/lib/env";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  const siteHost = new URL(env.siteUrl).host;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 15%, rgba(245,158,11,0.35), transparent 30%), radial-gradient(circle at 80% 85%, rgba(251,146,60,0.28), transparent 30%), linear-gradient(135deg, #130914 0%, #1a0e1d 48%, #2b140c 100%)",
          color: "#fff7ed",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 28,
            color: "#fed7aa",
          }}
        >
          <div
            style={{
              height: 54,
              width: 54,
              borderRadius: 18,
              background: "linear-gradient(135deg, #f59e0b, #c2410c)",
            }}
          />
          <span>{env.productName}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: 850 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            Save your recipes in one clean, searchable cooking workspace.
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, color: "#fdba74" }}>
            Keep ingredients, steps, favorites, and source links organized for the next time you cook.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#fed7aa" }}>{siteHost}</div>
      </div>
    ),
    size,
  );
}

