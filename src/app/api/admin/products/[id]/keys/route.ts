import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !["admin", "support"].includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { id } = await params;
  const keys = await prisma.productKey.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyValue: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      order: { select: { orderNumber: true } },
    },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

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
      keyValue,
      status: "available",
      addedById: token?.sub ?? null,
    })),
  });

  return NextResponse.json({ added: created.count }, { status: 201 });
}
