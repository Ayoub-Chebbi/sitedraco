import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { initiateFlouciPayment } from "@/lib/flouci";

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
      if (item.variantId) continue; // variants use manual stock managed separately
      const p = products.find((p) => p.id === item.productId)!;
      const availableKeys = await prisma.productKey.count({
        where: { productId: p.id, status: "available" },
      });
      const stock = availableKeys + (p.manualStock ?? 0);
      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `"${p.name}" est en rupture de stock.` },
          { status: 400 }
        );
      }
    }

    // For items with a variantId, validate the variant belongs to the product
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
    let guestAutoCreated = false;

    if (!userId) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
      } else {
        // Create account with a random unusable password — welcome email sent after payment
        const passwordHash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 12);
        const newUser = await prisma.user.create({
          data: { email, passwordHash, role: "customer" },
        });
        userId = newUser.id;
        guestAutoCreated = true;
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

    // Store paymentUrl and paymentRef so we can link back to it from dashboard
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: paymentId, paymentUrl },
    });

    if (appliedCouponId) {
      await prisma.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Welcome email is sent in /api/payment/flouci/verify after payment confirmed

    return NextResponse.json({ paymentUrl, orderId: order.id });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[flouci] initiate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
