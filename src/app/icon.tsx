import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/site-settings";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const { logoUrl } = await getSiteSettings();

  if (!logoUrl) {
    return new ImageResponse(
      <div style={{ width: 32, height: 32, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 700 }}>
        L
      </div>,
      { ...size }
    );
  }

  return new ImageResponse(
    <img src={logoUrl} width={32} height={32} style={{ objectFit: "cover", borderRadius: 4 }} />,
    { ...size }
  );
}
