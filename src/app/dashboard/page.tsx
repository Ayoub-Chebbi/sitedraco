import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Package, Key, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {session.user.name || session.user.email?.split("@")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenue dans votre espace client</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Commandes", value: orders.length, icon: <Package className="h-5 w-5 text-purple-400" />, href: "/dashboard/commandes" },
          { label: "Dépensé", value: formatPrice(totalSpent), icon: <Key className="h-5 w-5 text-purple-400" />, href: "/dashboard/cles" },
          { label: "Mon profil", value: "Voir", icon: <User className="h-5 w-5 text-purple-400" />, href: "/dashboard/profil" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                {stat.icon}
                <ArrowRight className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Commandes récentes</h2>
          <Link href="/dashboard/commandes">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-gray-800 bg-gray-900">
            <Package className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Aucune commande pour l&apos;instant</p>
            <Link href="/produits" className="mt-4 inline-block">
              <Button size="sm" className="mt-3">Parcourir le catalogue</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/commande/${order.orderNumber}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-gray-300">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {order.items.map((i) => i.product.name).join(", ")}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">{formatPrice(order.totalAmount)}</p>
                    <ArrowRight className="h-4 w-4 text-gray-600 ml-auto mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
