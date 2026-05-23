import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { _count: { select: { keys: { where: { status: "available" } } } } },
  });

  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  return NextResponse.json(product);
}
