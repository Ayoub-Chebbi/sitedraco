import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

const schema = z.object({
  status: z.enum(["pending", "processing", "delivered", "cancelled", "refunded"]).optional(),
  paymentStatus: z.enum(["pending", "awaiting_payment", "paid", "failed", "refunded"]).optional(),
  notesInternal: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { id } = await params;

  const order = await prisma.order.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "order_updated",
      targetType: "order",
      targetId: order.id,
      metadata: JSON.stringify({ ...parsed.data, updatedBy: user.email }),
    },
  });

  return NextResponse.json(order);
}
