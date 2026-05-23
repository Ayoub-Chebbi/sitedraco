import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CommandesPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">Dashboard</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Mes commandes</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 bg-gray-900">
          <Package className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">Aucune commande</p>
          <Link href="/produits" className="mt-4 inline-block">
            <Button className="mt-3">Parcourir le catalogue</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/commande/${order.orderNumber}`}>
              <div className="flex gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-200">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {order.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end justify-between shrink-0">
                  <span className="font-bold text-white">{formatPrice(order.totalAmount)}</span>
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
