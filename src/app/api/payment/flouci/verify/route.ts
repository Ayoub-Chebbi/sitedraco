import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyFlouciPayment } from "@/lib/flouci";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";
import { sendWelcomeEmail, sendPaymentConfirmedEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = await rateLimit(`verify:${ip}`, { max: 20, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

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

  // Prevent payment injection: paymentRef must match exactly
  // If paymentRef is still null (race window), reject — client will retry
  if (!order.paymentRef) {
    return NextResponse.json({ error: "Paiement en cours d'initialisation. Réessayez dans quelques secondes." }, { status: 409 });
  }
  if (order.paymentRef !== paymentId) {
    return NextResponse.json({ error: "Référence de paiement invalide." }, { status: 400 });
  }

  const success = await verifyFlouciPayment(paymentId);
  if (!success) {
    return NextResponse.json({ error: "Paiement non confirmé par Flouci." }, { status: 402 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "paid", paymentRef: paymentId, status: "processing", paidAt: new Date() },
  });

  // Deduct loyalty points now that payment is confirmed — atomic to prevent race condition
  if (order.loyaltyPointsUsed > 0 && order.userId) {
    prisma.$executeRaw`
      UPDATE "User" SET "loyaltyPoints" = "loyaltyPoints" - ${order.loyaltyPointsUsed}
      WHERE id = ${order.userId} AND "loyaltyPoints" >= ${order.loyaltyPointsUsed}
    `.then((affected) => affected > 0
      ? prisma.loyaltyTransaction.create({
          data: { userId: order.userId!, orderRef: order.id, type: "redeemed", amount: order.loyaltyPointsUsed, description: `Utilisé sur commande #${order.orderNumber}` },
        })
      : Promise.resolve(null)
    ).catch((err) => console.error("[verify] loyalty deduction failed:", err));
  }

  // Increment coupon usedCount only after payment is confirmed
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: 1 } },
    }).catch((err) => console.error("[verify] coupon increment failed:", err));
  }

  // Complete pending referral if this is the referred user's first paid order
  if (order.userId) {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: order.userId },
    });
    if (referral && referral.status === "pending") {
      const reward = 2;
      prisma.referral.update({
        where: { id: referral.id },
        data: { status: "completed", orderId: orderId, rewardGiven: reward, completedAt: new Date() },
      }).then(() => prisma.user.update({
        where: { id: referral.referrerId },
        data: { loyaltyPoints: { increment: reward } },
      })).then(() => prisma.loyaltyTransaction.create({
        data: { userId: referral.referrerId, orderRef: orderId, type: "earned", amount: reward, description: `Parrainage complété — +${reward} TND` },
      })).catch((err) => console.error("[verify] referral complete failed:", err));
    }
  }

  // Award 1% loyalty cashback for logged-in users
  if (order.userId) {
    const earned = Math.round(order.totalAmount * 0.01 * 1000) / 1000;
    prisma.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: earned } } })
      .then(() => prisma.loyaltyTransaction.create({
        data: { userId: order.userId!, orderRef: order.id, type: "earned", amount: earned, description: `1% cashback — commande #${order.orderNumber}` },
      }))
      .catch((err) => console.error("[verify] loyalty award failed:", err));
  }

  await notifyAdminsNewOrder({
    orderNumber: order.orderNumber,
    clientEmail: order.user?.email ?? order.guestEmail ?? "guest",
    clientName: order.user?.name ?? null,
    itemNames: order.items.map((i) => i.product.name),
    totalAmount: order.totalAmount,
    orderId: order.id,
  }).catch(console.error);

  // Payment confirmed email — sent to all customers
  const confirmedTo = order.user?.email ?? order.guestEmail;
  if (confirmedTo && !order.guestAutoCreated) {
    sendPaymentConfirmedEmail({
      to: confirmedTo,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    }).catch((err) => console.error("[verify] payment confirmed email failed:", err));
  }

  // Send welcome email to auto-created guest accounts only after payment confirmed
  // (welcome email already contains payment confirmation, so skip the duplicate)
  if (order.guestAutoCreated && order.user?.email) {
    const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";
    const token = randomBytes(32).toString("hex");
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

  return NextResponse.json({ orderNumber: order.orderNumber, totalAmount: order.totalAmount });
}
