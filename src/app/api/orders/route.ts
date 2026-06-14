import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  paymentMethod: z.enum(["flouci", "d17", "flouci_app", "virement"]),
  totalAmount: z.number().positive(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfterMs } = await rateLimit(`orders:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() } });
  }

  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { email, paymentMethod, items } = parsed.data;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Un ou plusieurs produits sont introuvables." }, { status: 400 });
  }

  const serverTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + (product.discountPrice ?? product.price) * item.quantity;
  }, 0);

  const orderNumber = generateOrderNumber();

  // For guest orders: auto-create account if email not already registered
  let userId: string | null = session?.user?.id ?? null;
  let autoCreated = false;

  if (!session) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      userId = existing.id;
    } else {
      // Generate a random unusable password — user sets their own via email link
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
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
      guestEmail: null,
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      totalAmount: serverTotal,
    },
  });

  // Neon HTTP adapter doesn't support transactions — insert items separately
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.discountPrice ?? product.price,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "order_created",
      targetType: "order",
      targetId: order.id,
      metadata: JSON.stringify({ orderNumber, paymentMethod, totalAmount: serverTotal, autoCreated }),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  if (autoCreated && userId) {
    const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    prisma.passwordResetToken.create({ data: { email, token, expiresAt } })
      .then(() =>
        sendWelcomeEmail(email, orderNumber, `${base}/reinitialiser-mot-de-passe?token=${token}`)
      )
      .catch((err) => console.error("Welcome email failed:", err));
  }

  await notifyAdminsNewOrder({
    orderNumber,
    clientEmail: email,
    clientName: session?.user?.name ?? null,
    itemNames: products.map((p) => p.name),
    totalAmount: serverTotal,
    orderId: order.id,
  }).catch(console.error);

  return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
}
