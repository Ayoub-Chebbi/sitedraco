import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptKey } from "@/lib/crypto";
import { sendDeliveryEmail, sendPaymentConfirmedEmail } from "@/lib/email";
import { z } from "zod";

async function checkAdminOrSupport() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return null;
  }
  return session;
}

const deliverSchema = z.object({
  action: z.literal("deliver"),
  items: z.array(z.object({
    itemId: z.string(),
    productId: z.string(),
    type: z.enum(["key", "account"]),
    keyValue: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
  })).min(1),
});

const statusSchema = z.object({
  action: z.enum(["mark_failed", "mark_processing", "mark_refunded", "confirm_payment"]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdminOrSupport();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, key: true } },
      user: { select: { id: true, email: true, name: true } },
      agent: { select: { id: true, email: true, name: true } },
      auditLogs: { orderBy: { createdAt: "asc" }, include: { actor: { select: { email: true } } } },
    },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdminOrSupport();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "deliver") {
    const parsed = deliverSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const emailItems: { productName: string; type: "key" | "account"; keyValue?: string; email?: string; password?: string }[] = [];

    for (const item of parsed.data.items) {
      let rawValue: string;
      let emailItem: typeof emailItems[number];

      if (item.type === "account") {
        const creds = JSON.stringify({ email: item.email, password: item.password });
        rawValue = `ACCOUNT::${creds}`;
        emailItem = { productName: "", type: "account", email: item.email, password: item.password };
      } else {
        rawValue = item.keyValue!;
        emailItem = { productName: "", type: "key", keyValue: item.keyValue };
      }

      const encryptedValue = encryptKey(rawValue);

      // Get product name for email
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: item.itemId },
        include: { product: { select: { name: true } } },
      });
      emailItem.productName = orderItem?.product.name ?? "Produit";

      const productKey = await prisma.productKey.create({
        data: {
          productId: item.productId,
          keyValue: encryptedValue,
          status: "delivered",
          orderId: id,
          addedById: session.user.id,
          deliveredAt: new Date(),
        },
      });

      await prisma.orderItem.update({
        where: { id: item.itemId },
        data: { keyId: productKey.id },
      });

      emailItems.push(emailItem);
    }

    await prisma.order.update({
      where: { id },
      data: { status: "delivered", agentId: session.user.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "key_delivered",
        targetType: "order",
        targetId: id,
        metadata: JSON.stringify({ agentEmail: session.user.email, itemCount: parsed.data.items.length }),
      },
    });

    // Send one consolidated delivery email
    const customerEmail = order.user?.email ?? order.guestEmail;
    if (customerEmail) {
      sendDeliveryEmail(customerEmail, order.orderNumber, emailItems).catch((err) =>
        console.error("[delivery] email failed:", err)
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/commandes");
    return NextResponse.json({ success: true });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Confirm manual payment proof — mark as paid and move to processing
  if (parsed.data.action === "confirm_payment") {
    const orderForEmail = await prisma.order.findUnique({
      where: { id },
      select: { orderNumber: true, totalAmount: true, guestAutoCreated: true, guestEmail: true, user: { select: { email: true } } },
    });

    await prisma.order.update({
      where: { id },
      data: { paymentStatus: "paid", status: "processing", paidAt: new Date(), agentId: session.user.id },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "confirm_payment",
        targetType: "order",
        targetId: id,
        metadata: JSON.stringify({ agentEmail: session.user.email }),
      },
    });

    if (orderForEmail) {
      const customerEmail = orderForEmail.user?.email ?? orderForEmail.guestEmail;
      if (customerEmail) {
        sendPaymentConfirmedEmail({
          to: customerEmail,
          orderNumber: orderForEmail.orderNumber,
          totalAmount: orderForEmail.totalAmount,
        }).catch((err) => console.error("[confirm_payment] email failed:", err));
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/commandes");
    return NextResponse.json({ success: true });
  }

  const statusMap: Record<string, string> = {
    mark_failed: "failed",
    mark_processing: "processing",
    mark_refunded: "refunded",
  };

  await prisma.order.update({
    where: { id },
    data: {
      status: statusMap[parsed.data.action],
      agentId: session.user.id,
      notesInternal: parsed.data.notes || undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: parsed.data.action,
      targetType: "order",
      targetId: id,
      metadata: JSON.stringify({ notes: parsed.data.notes }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
  return NextResponse.json({ success: true });
}
