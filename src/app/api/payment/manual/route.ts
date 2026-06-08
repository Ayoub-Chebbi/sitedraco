import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";
import { sendOrderConfirmationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  paymentMethod: z.enum(["d17", "flouci_app", "virement"]),
  paymentProofUrl: z.string().url().refine(
    (url) => url.startsWith("https://usy4zczaubjlufi6.public.blob.vercel-storage.com/"),
    { message: "URL de justificatif invalide." }
  ),
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
  const session = await auth();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  }

  const { email, paymentMethod, paymentProofUrl, items, couponCode, steamUsername, useLoyalty, referralCode } = parsed.data;

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: items.flatMap((i) => i.variantId ? [i.variantId] : []) }, isActive: true },
    }),
  ]);

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 400 });
  }

  // Server-side total
  const subtotal = items.reduce((sum, item) => {
    if (item.variantId) {
      const v = variants.find((v) => v.id === item.variantId);
      return sum + (v ? (v.discountPrice ?? v.price) : 0) * item.quantity;
    }
    const p = products.find((p) => p.id === item.productId)!;
    return sum + (p.discountPrice ?? p.price) * item.quantity;
  }, 0);

  // Resolve user
  let userId = session?.user?.id ?? null;
  let guestAutoCreated = false;
  if (!userId) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      userId = existing.id;
    } else {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
      const newUser = await prisma.user.create({ data: { email, passwordHash, role: "customer" } });
      userId = newUser.id;
      guestAutoCreated = true;
    }
  }

  // Apply coupon if any
  let discountAmount = 0;
  let appliedCouponId: string | null = null;
  if (couponCode && userId) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)) {
      const used = await prisma.order.count({ where: { userId, couponId: coupon.id, paymentStatus: "paid" } });
      if (used === 0) {
        discountAmount = coupon.type === "percentage"
          ? Math.min(subtotal, (subtotal * coupon.value) / 100)
          : Math.min(subtotal, coupon.value);
        discountAmount = Math.round(discountAmount * 100) / 100;
        appliedCouponId = coupon.id;
      }
    }
  }

  // Apply loyalty points if requested (logged-in users only)
  let loyaltyDiscount = 0;
  if (useLoyalty && userId && !guestAutoCreated) {
    const loyaltyUser = await prisma.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
    const balance = loyaltyUser?.loyaltyPoints ?? 0;
    if (balance >= 0.001) {
      loyaltyDiscount = Math.min(balance, Math.max(0, subtotal - discountAmount));
      loyaltyDiscount = Math.round(loyaltyDiscount * 1000) / 1000;
    }
  }

  const orderNumber = generateOrderNumber();

  // Deduct loyalty points
  if (loyaltyDiscount > 0 && userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: loyaltyDiscount } },
    });
  }

  // Validate referral code (first-time buyers only)
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
      paymentMethod,
      paymentStatus: "awaiting_verification",
      totalAmount,
      discountAmount,
      loyaltyPointsUsed: loyaltyDiscount,
      referralDiscount,
      paymentProofUrl,
      guestAutoCreated,
      ...(appliedCouponId && { couponId: appliedCouponId }),
      ...(steamUsername && { steamUsername }),
    },
  });

  if (loyaltyDiscount > 0 && userId) {
    prisma.loyaltyTransaction.create({
      data: { userId, orderRef: order.id, type: "redeemed", amount: loyaltyDiscount, description: `Utilisé sur commande #${orderNumber}` },
    }).catch(console.error);
  }

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
      data: { orderId: order.id, productId: item.productId, quantity: item.quantity, unitPrice },
    });
  }

  await notifyAdminsNewOrder({
    orderNumber,
    clientEmail: email,
    clientName: session?.user?.name ?? null,
    itemNames: products.map((p) => p.name),
    totalAmount,
    orderId: order.id,
  }).catch(console.error);

  sendOrderConfirmationEmail({
    to: email,
    orderNumber,
    items: items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const variant = item.variantId ? variants.find((v) => v.id === item.variantId) : null;
      const name = variant ? `${product.name} — ${variant.name}` : product.name;
      const unitPrice = variant ? (variant.discountPrice ?? variant.price) : (product.discountPrice ?? product.price);
      return { name, quantity: item.quantity, unitPrice };
    }),
    totalAmount,
    paymentMethod,
  }).catch((err) => console.error("[manual] confirmation email failed:", err));

  return NextResponse.json({ orderNumber: order.orderNumber, orderId: order.id }, { status: 201 });
}
