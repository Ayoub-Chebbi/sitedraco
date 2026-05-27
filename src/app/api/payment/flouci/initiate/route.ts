import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { initiateFlouciPayment } from "@/lib/flouci";
import { sendWelcomeEmail } from "@/lib/email";

function generatePassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const schema = z.object({
  email: z.string().email(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  couponCode: z.string().optional(),
  steamUsername: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides.", detail: parsed.error.flatten() }, { status: 400 });
    }

    const { email, items, couponCode, steamUsername } = parsed.data;

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: "Un ou plusieurs produits introuvables." }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => {
      const p = products.find((p) => p.id === item.productId)!;
      return sum + (p.discountPrice ?? p.price) * item.quantity;
    }, 0);

    // Validate and apply coupon
    let discountAmount = 0;
    let appliedCouponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minAmount || subtotal >= coupon.minAmount)
      ) {
        discountAmount =
          coupon.type === "percentage"
            ? Math.min(subtotal, (subtotal * coupon.value) / 100)
            : Math.min(subtotal, coupon.value);
        discountAmount = Math.round(discountAmount * 100) / 100;
        appliedCouponId = coupon.id;
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const orderNumber = generateOrderNumber();
    let userId = session?.user?.id ?? null;
    let autoCreated = false;
    let plainPassword = "";

    if (!userId) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
      } else {
        plainPassword = generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 12);
        const newUser = await prisma.user.create({
          data: { email, passwordHash, role: "customer" },
        });
        userId = newUser.id;
        autoCreated = true;
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "pending",
        paymentMethod: "flouci",
        paymentStatus: "awaiting_payment",
        totalAmount,
        discountAmount,
        ...(appliedCouponId && { couponId: appliedCouponId }),
        ...(steamUsername && { steamUsername }),
      },
    });

    // Neon HTTP adapter doesn't support transactions — insert items separately
    for (const item of items) {
      const p = products.find((p) => p.id === item.productId)!;
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: p.discountPrice ?? p.price,
        },
      });
    }

    const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";

    const { paymentUrl, paymentId } = await initiateFlouciPayment({
      amount: totalAmount,
      orderId: order.id,
      successLink: `${base}/checkout/success?orderId=${order.id}`,
      failLink: `${base}/checkout/fail?orderId=${order.id}`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: paymentId } });

    if (appliedCouponId) {
      await prisma.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (autoCreated) {
      sendWelcomeEmail(email, plainPassword, orderNumber).catch((err) =>
        console.error("[flouci] welcome email failed:", err)
      );
    }

    return NextResponse.json({ paymentUrl, orderId: order.id });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[flouci] initiate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
