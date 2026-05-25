import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  accountDescription: z.string().max(2000).optional().nullable(),
  platform: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(50).optional(),
  brand: z.string().max(80).optional().nullable(),
  productType: z.enum(["key", "account", "both"]).optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  accountPrice: z.number().positive().optional().nullable(),
  accountDiscountPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  soldCount: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  urgencyHours: z.number().int().min(0).optional(),
  manualStock: z.number().int().min(0).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.slug) {
    const conflict = await prisma.product.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (conflict) return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });
  }

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
