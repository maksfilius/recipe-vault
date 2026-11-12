import { ImageResponse } from "next/og";
import { env } from "@/src/lib/env";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f3ebe2", color: "#281d2b", padding: 62, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 650, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 27, fontWeight: 700 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#b34414", color: "#fffaf5" }}>K</span>
          Keep &amp; Cook
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 70, lineHeight: 1.04, letterSpacing: -2, fontWeight: 700 }}><span>Keep the recipe.</span><span>Skip the clutter.</span></div>
          <div style={{ fontSize: 27, lineHeight: 1.35, color: "#63544e" }}>Clear ingredients and steps from a recipe link.</div>
        </div>
        <div style={{ fontSize: 22, color: "#b34414" }}>{new URL(env.siteUrl).host}</div>
      </div>
      <div style={{ display: "flex", width: 350, marginLeft: 50, alignSelf: "center", flexDirection: "column", background: "#fffdf9", border: "2px solid #baa99b", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "24px 28px", borderBottom: "2px solid #baa99b", fontSize: 24, fontWeight: 700 }}>Recipe preview</div>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ color: "#b34414", fontSize: 17, fontWeight: 700 }}>FROM YOUR FAVORITE SITE</div>
          <div style={{ fontSize: 31, fontWeight: 700 }}>A good recipe, ready to cook</div>
          <div style={{ height: 2, background: "#baa99b" }} />
          <div style={{ fontSize: 21 }}>Ingredients</div>
          <div style={{ fontSize: 18, color: "#63544e" }}>Everything in one place</div>
          <div style={{ height: 2, background: "#baa99b" }} />
          <div style={{ fontSize: 21 }}>Steps</div>
          <div style={{ fontSize: 18, color: "#63544e" }}>1. Read, cook, keep.</div>
        </div>
      </div>
    </div>,
    size,
  );
}
