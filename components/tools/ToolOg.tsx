import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared social card for the free tools: maroon field, gold rule, title and a color strip. */
export function toolOgImage(title: string, subtitle: string, colors: string[]) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#4a0d1a", padding: 64, color: "#fff8ef" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#ecd08a" }}>
          <div style={{ width: 14, height: 14, background: "#ecd08a", transform: "rotate(45deg)" }} />
          MandapCanvas · Free tool
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 700, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#f3e3d3", maxWidth: 980 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", height: 28, borderRadius: 14, overflow: "hidden" }}>
          {colors.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
