import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(variants);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const variant = await prisma.productVariant.create({
    data: { productId: id, ...parsed.data },
  });

  return NextResponse.json(variant, { status: 201 });
}
