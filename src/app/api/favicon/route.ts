import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { logoUrl } = await getSiteSettings();

  if (!logoUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const res = await fetch(logoUrl, { next: { revalidate: 3600 } });
  if (!res.ok) return new NextResponse(null, { status: 404 });

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
