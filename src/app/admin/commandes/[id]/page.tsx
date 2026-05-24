import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./order-detail-client";
import { formatDate } from "@/lib/utils";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, key: true } },
      user: { select: { id: true, email: true, name: true, createdAt: true } },
      agent: { select: { email: true, name: true } },
      auditLogs: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { email: true } } },
      },
    },
  });

  if (!order) notFound();

  const serialized = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    notesInternal: order.notesInternal,
    createdAt: order.createdAt.toISOString(),
    customer: order.user
      ? { email: order.user.email, name: order.user.name, since: formatDate(order.user.createdAt) }
      : { email: order.guestEmail || "Invité", name: null, since: null },
    agent: order.agent ? { email: order.agent.email, name: order.agent.name } : null,
    items: order.items.map((item: typeof order.items[0]) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      hasKey: !!item.key,
      productType: item.product.productType ?? "key",
      product: { id: item.product.id, name: item.product.name, platform: item.product.platform, imageUrl: item.product.imageUrl },
    })),
    auditLogs: order.auditLogs.map((log: typeof order.auditLogs[0]) => ({
      id: log.id,
      action: log.action,
      actorEmail: log.actor?.email || "Système",
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata,
    })),
  };

  return <OrderDetailClient order={serialized} />;
}
