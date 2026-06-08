import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") return false;
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const rows = await prisma.siteSettings.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json(settings);
}

const ALLOWED_SETTINGS_KEYS = new Set(["siteName", "logoUrl", "siteTagline", "siteUrl"]);

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const body = await req.json();
  const entries = Object.entries(body).filter(([key]) => ALLOWED_SETTINGS_KEYS.has(key));
  if (entries.length === 0) return NextResponse.json({ error: "Aucune clé valide." }, { status: 400 });
  const updates = await Promise.all(
    entries.map(([key, value]) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  return NextResponse.json({ ok: true, updated: updates.length });
}
