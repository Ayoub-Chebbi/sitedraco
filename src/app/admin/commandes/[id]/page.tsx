import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./order-detail-client";
import { formatDate } from "@/lib/utils";
import { decryptKey } from "@/lib/crypto";

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
    paymentProofUrl: order.paymentProofUrl,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    steamUsername: order.steamUsername,
    notesInternal: order.notesInternal,
    createdAt: order.createdAt.toISOString(),
    customer: order.user
      ? { email: order.user.email, name: order.user.name, since: formatDate(order.user.createdAt) }
      : { email: order.guestEmail || "Invité", name: null, since: null },
    agent: order.agent ? { email: order.agent.email, name: order.agent.name } : null,
    items: order.items.map((item: typeof order.items[0]) => {
      let deliveredKey: { type: "key"; value: string } | { type: "account"; email: string; password: string } | null = null;
      if (item.key) {
        try {
          const raw = decryptKey(item.key.keyValue);
          if (raw.startsWith("ACCOUNT::")) {
            const creds = JSON.parse(raw.slice(9));
            deliveredKey = { type: "account", email: creds.email, password: creds.password };
          } else {
            deliveredKey = { type: "key", value: raw };
          }
        } catch { /* decryption failed */ }
      }
      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        hasKey: !!item.key,
        deliveredAt: item.key?.deliveredAt?.toISOString() ?? null,
        deliveredKey,
        productType: item.product.productType ?? "key",
        product: { id: item.product.id, name: item.product.name, platform: item.product.platform, imageUrl: item.product.imageUrl },
      };
    }),
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
