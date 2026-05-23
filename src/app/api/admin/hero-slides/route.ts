import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !["admin", "support"].includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const SlideSchema = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(300),
  badge: z.string().min(1).max(80),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  href: z.string().min(1),
  imageUrl: z.string().min(1),
  gradient: z.string().optional().default("from-purple-950/90 via-purple-950/60 to-transparent"),
  accentColor: z.string().optional().default("text-purple-400"),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const guard = all ? await requireAdmin(req) : null;
  if (all && guard) return guard;

  const slides = await prisma.heroSlide.findMany({
    where: all ? undefined : { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json(slides);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const body = await req.json();
  const parsed = SlideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const slide = await prisma.heroSlide.create({ data: parsed.data });
  return NextResponse.json(slide, { status: 201 });
}
