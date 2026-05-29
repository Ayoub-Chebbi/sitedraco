import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export async function GET() {
  const { siteName, logoUrl } = await getSiteSettings();
  return NextResponse.json({ siteName, logoUrl });
}
