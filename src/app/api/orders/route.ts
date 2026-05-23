import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyAdminsNewOrder } from "@/lib/push-notifications";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  paymentMethod: z.string(),
  totalAmount: z.number().positive(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

function generatePassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
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
  let plainPassword = "";

  if (!session) {
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
      guestEmail: null,
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      totalAmount: serverTotal,
      items: {
        create: items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.discountPrice ?? product.price,
          };
        }),
      },
    },
  });

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

  if (autoCreated) {
    sendWelcomeEmail(email, plainPassword, orderNumber).catch(console.error);
  }

  notifyAdminsNewOrder({
    orderNumber,
    clientEmail: email,
    clientName: session?.user?.name ?? null,
    itemNames: products.map((p) => p.name),
    totalAmount: serverTotal,
    orderId: order.id,
  }).catch(console.error);

  return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
}
