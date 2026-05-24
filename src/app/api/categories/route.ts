import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DEFAULTS = [
  { slug: "game",         label: "Jeu complet",   displayOrder: 0 },
  { slug: "dlc",          label: "DLC",            displayOrder: 1 },
  { slug: "subscription", label: "Abonnement",     displayOrder: 2 },
  { slug: "credit",       label: "Crédit",         displayOrder: 3 },
  { slug: "giftcard",     label: "Carte cadeau",   displayOrder: 4 },
];

const Schema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, "Slug invalide"),
  label: z.string().min(1).max(100),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function GET() {
  let categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });

  if (categories.length === 0) {
    await prisma.category.createMany({ data: DEFAULTS, skipDuplicates: true });
    categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });
  }

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });
  }
}
