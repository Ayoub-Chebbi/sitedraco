"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice, formatDate } from "@/lib/utils";

type Props = {
  topProducts: { id: string; name: string; platform: string; sales: number; stock: number; price: number }[];
  recentOrders: { id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string; customerEmail: string; products: string }[];
  lowStockProducts: { id: string; name: string; stock: number; alert: number }[];
};

export function AdminMetricsClient({ topProducts, recentOrders, lowStockProducts }: Props) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Recent orders */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Commandes récentes</h2>
          <Link href="/admin/commandes">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              Toutes <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">N° commande</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Montant</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono text-xs text-gray-300">{order.orderNumber}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-xs truncate max-w-[140px]">{order.customerEmail}</p>
                      <p className="text-gray-600 text-xs truncate max-w-[140px]">{order.products}</p>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/commandes/${order.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-purple-400 hover:text-purple-300">
                          Traiter
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Low stock alerts */}
        {lowStockProducts.length > 0 && (
          <div>
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Alertes stock
            </h2>
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-yellow-800/30 bg-yellow-900/10">
                  <p className="text-sm text-gray-300 truncate max-w-[160px]">{p.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.stock === 0 ? "bg-red-600/20 text-red-400" : "bg-yellow-600/20 text-yellow-400"
                  }`}>
                    {p.stock} dispo.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top products */}
        <div>
          <h2 className="font-semibold text-white mb-3">Top produits</h2>
          <div className="space-y-2">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 bg-gray-900">
                <span className="w-5 text-xs font-bold text-gray-600">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PlatformBadge platform={p.platform} />
                    <span className="text-xs text-gray-600">{p.sales} vendus</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">{formatPrice(p.price)}</p>
                  <p className="text-xs text-gray-600">{p.stock} en stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
