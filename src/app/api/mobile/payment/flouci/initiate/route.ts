import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";
import { generateOrderNumber } from "@/lib/utils";
import { initiateFlouciPayment } from "@/lib/flouci";

const schema = z.object({
  email: z.string().email(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const mobileUser = await getMobileUser(req);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const { email, items } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 400 });
  }

  const totalAmount = items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId)!;
    return sum + (p.discountPrice ?? p.price) * item.quantity;
  }, 0);

  const orderNumber = generateOrderNumber();
  let userId = mobileUser?.id ?? null;

  if (!userId) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) userId = existing.id;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: "pending",
      paymentMethod: "flouci",
      paymentStatus: "awaiting_payment",
      totalAmount,
    },
  });

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

  try {
    const { paymentUrl, paymentId } = await initiateFlouciPayment({
      amount: totalAmount,
      orderId: order.id,
      // Deep link: expo-web-browser's openAuthSessionAsync catches lootstore:// redirects
      successLink: `lootstore://checkout/success?orderId=${order.id}`,
      failLink: `lootstore://checkout/fail`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: paymentId } });

    return NextResponse.json({ paymentUrl, orderId: order.id, paymentId });
  } catch (err) {
    console.error("[flouci] mobile initiate error:", err);
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    return NextResponse.json({ error: "Erreur de paiement. Réessayez." }, { status: 502 });
  }
}
