import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptKey } from "@/lib/crypto";
import { z } from "zod";

async function checkAdminOrSupport() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return null;
  }
  return session;
}

const deliverSchema = z.object({
  action: z.literal("deliver"),
  keyValue: z.string().min(1),
});

const statusSchema = z.object({
  action: z.enum(["mark_failed", "mark_processing", "mark_refunded"]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdminOrSupport();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, key: true } },
      user: { select: { id: true, email: true, name: true } },
      agent: { select: { id: true, email: true, name: true } },
      auditLogs: { orderBy: { createdAt: "asc" }, include: { actor: { select: { email: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdminOrSupport();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "deliver") {
    const parsed = deliverSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const encryptedKey = encryptKey(parsed.data.keyValue);

    const productKey = await prisma.productKey.create({
      data: {
        productId: order.items[0].productId,
        keyValue: encryptedKey,
        status: "delivered",
        orderId: order.id,
        addedById: session.user.id,
        deliveredAt: new Date(),
      },
    });

    await prisma.orderItem.update({
      where: { id: order.items[0].id },
      data: { keyId: productKey.id },
    });

    await prisma.order.update({
      where: { id },
      data: { status: "delivered", agentId: session.user.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "key_delivered",
        targetType: "order",
        targetId: id,
        metadata: JSON.stringify({ agentEmail: session.user.email }),
      },
    });

    return NextResponse.json({ success: true });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const statusMap: Record<string, string> = {
    mark_failed: "failed",
    mark_processing: "processing",
    mark_refunded: "refunded",
  };

  await prisma.order.update({
    where: { id },
    data: {
      status: statusMap[parsed.data.action],
      agentId: session.user.id,
      notesInternal: parsed.data.notes || undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: parsed.data.action,
      targetType: "order",
      targetId: id,
      metadata: JSON.stringify({ notes: parsed.data.notes }),
    },
  });

  return NextResponse.json({ success: true });
}
