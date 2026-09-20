import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 192,
  height: 192,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "44px",
          border: "4px solid #f59e0b",
        }}
      >
        <div
          style={{
            fontSize: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🕌
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#f59e0b",
            letterSpacing: 2,
            marginTop: 4,
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
