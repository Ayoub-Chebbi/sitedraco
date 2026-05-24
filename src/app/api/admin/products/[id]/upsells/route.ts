import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const upsells = await prisma.productUpsell.findMany({
    where: { productId: id },
    include: {
      upsellProduct: {
        select: { id: true, name: true, slug: true, platform: true, price: true, discountPrice: true, imageUrl: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json(upsells);
}

const AddSchema = z.object({
  upsellProductId: z.string().min(1),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.upsellProductId === id) {
    return NextResponse.json({ error: "Un produit ne peut pas être son propre upsell" }, { status: 400 });
  }

  const upsell = await prisma.productUpsell.upsert({
    where: { productId_upsellProductId: { productId: id, upsellProductId: parsed.data.upsellProductId } },
    create: { productId: id, upsellProductId: parsed.data.upsellProductId, displayOrder: parsed.data.displayOrder },
    update: { displayOrder: parsed.data.displayOrder },
  });

  return NextResponse.json(upsell, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const upsellProductId = searchParams.get("upsellProductId");
  if (!upsellProductId) return NextResponse.json({ error: "upsellProductId required" }, { status: 400 });

  await prisma.productUpsell.deleteMany({
    where: { productId: id, upsellProductId },
  });

  return new NextResponse(null, { status: 204 });
}
