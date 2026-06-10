import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { initiateFlouciPayment } from "@/lib/flouci";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
  })).min(1),
  couponCode: z.string().optional(),
  steamUsername: z.string().max(100).optional(),
  useLoyalty: z.boolean().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfterMs } = await rateLimit(`pay:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() } });
  }

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

    const { email, items, couponCode, steamUsername, useLoyalty, referralCode } = parsed.data;

    const [products, variants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      }),
      prisma.productVariant.findMany({
        where: {
          id: { in: items.flatMap((i) => i.variantId ? [i.variantId] : []) },
          isActive: true,
        },
      }),
    ]);

    // Compare against unique productIds — multiple variants of the same product share one product record
    const uniqueProductIds = new Set(items.map((i) => i.productId));
    if (products.length !== uniqueProductIds.size) {
      return NextResponse.json({ error: "Un ou plusieurs produits introuvables." }, { status: 400 });
    }

    // Server-side stock check
    for (const item of items) {
      if (item.variantId) continue;
      const p = products.find((p) => p.id === item.productId)!;
      const availableKeys = await prisma.productKey.count({
        where: { productId: p.id, status: "available" },
      });
      const stock = availableKeys + (p.manualStock ?? 0);
      if (stock < item.quantity) {
        return NextResponse.json({ error: `"${p.name}" est en rupture de stock.` }, { status: 400 });
      }
    }

    // Validate variant ownership
    for (const item of items) {
      if (item.variantId) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant || variant.productId !== item.productId) {
          return NextResponse.json({ error: "Variante invalide." }, { status: 400 });
        }
      }
    }

    const subtotal = items.reduce((sum, item) => {
      if (item.variantId) {
        const v = variants.find((v) => v.id === item.variantId)!;
        return sum + (v.discountPrice ?? v.price) * item.quantity;
      }
      const p = products.find((p) => p.id === item.productId)!;
      return sum + (p.discountPrice ?? p.price) * item.quantity;
    }, 0);

    // Resolve userId first so we can check per-user coupon reuse
    const orderNumber = generateOrderNumber();
    let userId = session?.user?.id ?? null;
    let guestAutoCreated = false;

    if (!userId) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
      } else {
        // Create account with a random unusable password — welcome email sent after payment
        const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
        const newUser = await prisma.user.create({
          data: { email, passwordHash, role: "customer" },
        });
        userId = newUser.id;
        guestAutoCreated = true;
      }
    }

    // Validate and apply coupon (after userId is known)
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
        // Prevent same user from reusing the same coupon on multiple paid orders
        const alreadyUsed = userId ? await prisma.order.count({
          where: { userId, couponId: coupon.id, paymentStatus: "paid" },
        }) : 0;

        if (alreadyUsed === 0) {
          discountAmount =
            coupon.type === "percentage"
              ? Math.min(subtotal, (subtotal * coupon.value) / 100)
              : Math.min(subtotal, coupon.value);
          discountAmount = Math.round(discountAmount * 100) / 100;
          appliedCouponId = coupon.id;
        }
      }
    }

    // Apply loyalty points if requested — only for the authenticated session user.
    // Guard prevents a guest passing someone else's email from draining that user's balance.
    let loyaltyDiscount = 0;
    if (useLoyalty && session?.user?.id && session.user.id === userId) {
      const loyaltyUser = await prisma.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
      const balance = loyaltyUser?.loyaltyPoints ?? 0;
      if (balance >= 0.001) {
        loyaltyDiscount = Math.min(balance, Math.max(0, subtotal - discountAmount));
        loyaltyDiscount = Math.round(loyaltyDiscount * 1000) / 1000;
      }
    }

    // Note: loyalty points are NOT deducted here.
    // They are deducted in /verify only after Flouci confirms payment.
    // Exception: totalAmount=0 (fully covered) is handled below before returning.

    // Validate referral code (only for first-time buyers)
    let referralDiscount = 0;
    let referrerId: string | null = null;
    if (referralCode && userId) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (referrer && referrer.id !== userId) {
        const [priorPaid, existingReferral] = await Promise.all([
          prisma.order.count({ where: { userId, paymentStatus: "paid" } }),
          prisma.referral.findUnique({ where: { referredUserId: userId } }),
        ]);
        if (priorPaid === 0 && !existingReferral) {
          referralDiscount = Math.round(Math.max(0, subtotal - discountAmount - loyaltyDiscount) * 0.05 * 1000) / 1000;
          referrerId = referrer.id;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount - loyaltyDiscount - referralDiscount);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "pending",
        paymentMethod: "flouci",
        paymentStatus: "awaiting_payment",
        totalAmount,
        discountAmount,
        loyaltyPointsUsed: loyaltyDiscount,
        referralDiscount,
        guestAutoCreated,
        ...(appliedCouponId && { couponId: appliedCouponId }),
        ...(steamUsername && { steamUsername }),
      },
    });

    // Create pending referral record
    if (referrerId && userId && referralDiscount > 0) {
      prisma.referral.create({
        data: { referrerId, referredUserId: userId, status: "pending", discountGiven: referralDiscount },
      }).catch(console.error);
    }

    for (const item of items) {
      const unitPrice = item.variantId
        ? (() => { const v = variants.find((v) => v.id === item.variantId)!; return v.discountPrice ?? v.price; })()
        : (() => { const p = products.find((p) => p.id === item.productId)!; return p.discountPrice ?? p.price; })();

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          ...(item.variantId && { variantId: item.variantId }),
          quantity: item.quantity,
          unitPrice,
        },
      });
    }

    // If loyalty covers the full order, skip Flouci and mark paid directly
    if (totalAmount === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", status: "processing", paidAt: new Date() },
      });
      if (appliedCouponId) {
        prisma.coupon.update({ where: { id: appliedCouponId }, data: { usedCount: { increment: 1 } } }).catch(console.error);
      }
      if (loyaltyDiscount > 0 && userId) {
        // Atomic conditional decrement — prevents race condition double-spend
        const affected = await prisma.$executeRaw`
          UPDATE "User" SET "loyaltyPoints" = "loyaltyPoints" - ${loyaltyDiscount}
          WHERE id = ${userId} AND "loyaltyPoints" >= ${loyaltyDiscount}
        `;
        if (affected > 0) {
          prisma.loyaltyTransaction.create({
            data: { userId, orderRef: order.id, type: "redeemed", amount: loyaltyDiscount, description: `Utilisé sur commande #${orderNumber}` },
          }).catch(console.error);
        }
      }
      return NextResponse.json({ paymentUrl: `/checkout/success?orderId=${order.id}`, orderId: order.id });
    }

    const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";

    const { paymentUrl, paymentId } = await initiateFlouciPayment({
      amount: totalAmount,
      orderId: order.id,
      successLink: `${base}/checkout/success?orderId=${order.id}`,
      failLink: `${base}/checkout/fail?orderId=${order.id}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: paymentId, paymentUrl },
    });

    if (loyaltyDiscount > 0 && userId) {
      prisma.loyaltyTransaction.create({
        data: { userId, orderRef: order.id, type: "redeemed", amount: loyaltyDiscount, description: `Utilisé sur commande #${orderNumber}` },
      }).catch(console.error);
    }

    return NextResponse.json({ paymentUrl, orderId: order.id });

  } catch (err) {
    console.error("[flouci] initiate error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Erreur de paiement. Veuillez réessayer." }, { status: 500 });
  }
}
