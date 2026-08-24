import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "AniDot — Animated Dot-Matrix Converter";

export function buildOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 200, letterSpacing: -8, fontWeight: 700 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 22,
                height: 22,
                margin: "0 8px",
                borderRadius: 9999,
                background: i % 2 === 0 ? "#fafafa" : "#525252",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 24 }}>AniDot</div>
        <div style={{ fontSize: 36, color: "#a3a3a3", marginTop: 16 }}>
          Animated dot-matrix image converter
        </div>
      </div>
    ),
    ogSize
  );
}
