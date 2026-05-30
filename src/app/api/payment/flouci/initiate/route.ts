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
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfterMs } = rateLimit(`pay:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 });
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

    const { email, items, couponCode, steamUsername } = parsed.data;

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

    if (products.length !== items.length) {
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

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: "pending",
        paymentMethod: "flouci",
        paymentStatus: "awaiting_payment",
        totalAmount,
        discountAmount,
        guestAutoCreated,
        ...(appliedCouponId && { couponId: appliedCouponId }),
        ...(steamUsername && { steamUsername }),
      },
    });

    for (const item of items) {
      const unitPrice = item.variantId
        ? (() => { const v = variants.find((v) => v.id === item.variantId)!; return v.discountPrice ?? v.price; })()
        : (() => { const p = products.find((p) => p.id === item.productId)!; return p.discountPrice ?? p.price; })();

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
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

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: paymentId, paymentUrl },
    });

    // usedCount incremented in /verify after payment confirmed
    // Welcome email sent in /verify after payment confirmed

    return NextResponse.json({ paymentUrl, orderId: order.id });

  } catch (err) {
    console.error("[flouci] initiate error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Erreur de paiement. Veuillez réessayer." }, { status: 500 });
  }
}
