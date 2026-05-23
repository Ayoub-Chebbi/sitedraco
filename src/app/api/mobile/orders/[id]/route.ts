import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { orderNumber: id, userId: user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, platform: true } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  return NextResponse.json(order);
}
