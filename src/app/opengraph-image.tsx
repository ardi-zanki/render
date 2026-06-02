import { ImageResponse } from "next/og";

export const alt =
  "RenderAI — Workspace Render AI untuk Arsitektur & Interior";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded Open Graph image used for social link previews across the site. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#102a56",
          color: "#ffffff",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="60" height="60" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="10" fill="#ffffff" />
            <path d="M11.5 28 18 12h4.4l-6.5 16H11.5Z" fill="#102a56" />
            <path d="M20.6 28 27.1 12h4.4l-6.5 16h-4.4Z" fill="#102a56" />
          </svg>
          <div style={{ fontSize: 42, fontWeight: 800 }}>RenderAI.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 920,
            }}
          >
            Dari draft desain ke visual presentasi
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.8)" }}>
            Workspace render AI untuk arsitek & interior designer
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
