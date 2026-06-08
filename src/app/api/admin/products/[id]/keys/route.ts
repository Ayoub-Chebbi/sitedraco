import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@/lib/crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const keys = await prisma.productKey.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      order: { select: { orderNumber: true } },
    },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const raw: string = body.keys ?? "";
  const values = raw
    .split(/\r?\n/)
    .map((k: string) => k.trim())
    .filter((k: string) => k.length > 0);

  if (values.length === 0) {
    return NextResponse.json({ error: "Aucune clé fournie" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

  const created = await prisma.productKey.createMany({
    data: values.map((keyValue: string) => ({
      productId: id,
      keyValue: encryptKey(keyValue),
      status: "available",
      addedById: session.user.id,
    })),
  });

  return NextResponse.json({ added: created.count }, { status: 201 });
}
