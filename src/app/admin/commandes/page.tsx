import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const params = await searchParams;
  const statusFilter = params.status || "all";

  const orders = await prisma.order.findMany({
    where: statusFilter !== "all" ? { status: statusFilter } : undefined,
    include: {
      items: { include: { product: { select: { name: true, platform: true } } } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const TABS = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "processing", label: "En traitement" },
    { value: "delivered", label: "Livrées" },
    { value: "failed", label: "Échouées" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">Admin</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Commandes</h1>
        <span className="text-gray-500 text-sm">({orders.length})</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <Link key={tab.value} href={`/admin/commandes${tab.value !== "all" ? `?status=${tab.value}` : ""}`}>
            <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}>
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Commande</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Produits</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Paiement</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-semibold text-gray-200">{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-300 truncate max-w-[160px]">
                      {order.user?.email || order.guestEmail || "Invité"}
                    </p>
                    {order.user?.name && <p className="text-xs text-gray-600">{order.user.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">
                      {order.items.map((i) => i.product.name).join(", ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === "paid" ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"
                    }`}>
                      {order.paymentStatus === "paid" ? "Payé" : "En attente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/commandes/${order.id}`}>
                      <Button size="sm" variant={order.status === "pending" || order.status === "processing" ? "default" : "ghost"} className="gap-1">
                        Traiter <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Aucune commande{statusFilter !== "all" ? ` avec ce statut` : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
