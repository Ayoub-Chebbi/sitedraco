import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderTrackingClient } from "./order-tracking-client";
import { decryptKey } from "@/lib/crypto";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: true,
          key: true,
        },
      },
    },
  });

  if (!order) notFound();

  // Enforce ownership: only the order owner can view it
  if (order.userId && order.userId !== session.user.id && session.user.role !== "admin" && session.user.role !== "support") {
    notFound();
  }

  const safeOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: {
        id: item.product.id,
        name: item.product.name,
        platform: item.product.platform,
        imageUrl: item.product.imageUrl,
      },
      key: item.key && order.status === "delivered"
        ? { value: (() => { try { return decryptKey(item.key!.keyValue) ?? ""; } catch { return ""; } })() }
        : null,
    })),
  };

  return <OrderTrackingClient order={safeOrder} />;
}
