import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  value: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, "Valeur invalide"),
  label: z.string().min(1).max(100),
  emoji: z.string().max(8).optional().default("🎮"),
  showInHeader: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session || !["admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const platforms = await prisma.platform.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });
  return NextResponse.json(platforms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const platform = await prisma.platform.create({ data: parsed.data });
    return NextResponse.json(platform, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Cette valeur est déjà utilisée." }, { status: 409 });
  }
}
