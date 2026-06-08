import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["customer", "support", "admin"] } },
    include: {
      loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, type: true, amount: true, description: true, createdAt: true } },
      orders: {
        include: {
          items: {
            include: {
              product: { select: { name: true, platform: true, imageUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
    lastLogin: u.lastLogin?.toISOString() ?? null,
    loyaltyPoints: u.loyaltyPoints,
    loyaltyTransactions: u.loyaltyTransactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    orders: u.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productName: i.product.name,
        platform: i.product.platform,
      })),
    })),
  }));

  return <UsersClient initialUsers={serialized} isAdmin={session.user.role === "admin"} />;
}
