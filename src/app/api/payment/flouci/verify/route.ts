import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlouciPayment } from "@/lib/flouci";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  let body: { paymentId?: string; orderId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const { paymentId, orderId } = body;
  if (!paymentId || !orderId) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, user: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  // Idempotent: already verified
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ orderNumber: order.orderNumber });
  }

  if (order.paymentStatus !== "awaiting_payment") {
    return NextResponse.json({ error: "Statut de commande inattendu." }, { status: 409 });
  }

  // Prevent payment injection: verify the paymentId matches what we stored
  if (order.paymentRef && order.paymentRef !== paymentId) {
    return NextResponse.json({ error: "Référence de paiement invalide." }, { status: 400 });
  }

  const success = await verifyFlouciPayment(paymentId);
  if (!success) {
    return NextResponse.json({ error: "Paiement non confirmé par Flouci." }, { status: 402 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "paid", paymentRef: paymentId, status: "processing" },
  });

  notifyAdminsNewOrder({
    orderNumber: order.orderNumber,
    clientEmail: order.user?.email ?? order.guestEmail ?? "guest",
    clientName: order.user?.name ?? null,
    itemNames: order.items.map((i) => i.product.name),
    totalAmount: order.totalAmount,
    orderId: order.id,
  }).catch(console.error);

  return NextResponse.json({ orderNumber: order.orderNumber });
}
