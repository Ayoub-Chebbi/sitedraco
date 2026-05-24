import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  subtitle: z.string().min(1).max(300).optional(),
  badge: z.string().min(1).max(80).optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  href: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  gradient: z.string().optional(),
  accentColor: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const slide = await prisma.heroSlide.update({ where: { id }, data: parsed.data });
  return NextResponse.json(slide);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.heroSlide.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
