import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #047857 100%)",
          borderRadius: "36px",
          border: "3px solid #f59e0b",
        }}
      >
        <div
          style={{
            fontSize: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🕌
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: "#f59e0b",
            letterSpacing: 2,
            marginTop: 2,
            fontFamily: "sans-serif",
          }}
        >
          SDI SMART
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
