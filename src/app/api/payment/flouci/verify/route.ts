import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFlouciPayment } from "@/lib/flouci";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";
import { sendWelcomeEmail } from "@/lib/email";

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

  // Increment coupon usedCount only after payment is confirmed
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: 1 } },
    }).catch((err) => console.error("[verify] coupon increment failed:", err));
  }

  notifyAdminsNewOrder({
    orderNumber: order.orderNumber,
    clientEmail: order.user?.email ?? order.guestEmail ?? "guest",
    clientName: order.user?.name ?? null,
    itemNames: order.items.map((i) => i.product.name),
    totalAmount: order.totalAmount,
    orderId: order.id,
  }).catch(console.error);

  // Send welcome email to auto-created guest accounts only after payment confirmed
  if (order.guestAutoCreated && order.user?.email) {
    const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    try {
      await prisma.passwordResetToken.create({
        data: { email: order.user.email, token, expiresAt },
      });

      sendWelcomeEmail(
        order.user.email,
        order.orderNumber,
        `${base}/mot-de-passe-oublie/reset?token=${token}`
      ).catch((err) => console.error("[verify] welcome email failed:", err));
    } catch (err) {
      console.error("[verify] failed to create reset token:", err);
    }
  }

  return NextResponse.json({ orderNumber: order.orderNumber });
}
