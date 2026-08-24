import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "70px solid transparent",
            borderRight: "70px solid transparent",
            borderBottom: "120px solid #fafafa",
          }}
        />
      </div>
    ),
    size
  );
}
