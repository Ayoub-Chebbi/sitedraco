"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { useToast } from "@/lib/use-toast";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentProofUrl: string | null;
  totalAmount: number;
  loyaltyPointsUsed: number;
  guestEmail: string | null;
  createdAt: string;
  items: { product: { name: string }; variant: { name: string } | null }[];
  user: { email: string; name: string | null } | null;
};

const METHOD_LABEL: Record<string, string> = {
  flouci:     "Carte bancaire",
  d17:        "D17",
  flouci_app: "Flouci",
  virement:   "Virement",
};

export function CommandesTable({ orders, activeTab }: { orders: Order[]; activeTab: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [marking, setMarking] = useState<string | null>(null);

  async function markPaid(orderId: string) {
    setMarking(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_payment" }),
      });
      if (res.ok) {
        toast({ title: "Paiement confirmé", variant: "success" });
        router.refresh();
      } else {
        const data = await res.json();
        toast({ title: "Erreur", description: data.error, variant: "error" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "error" });
    } finally {
      setMarking(null);
    }
  }

  return (
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
            {orders.map((order) => {
              const isAwaiting = order.paymentStatus === "awaiting_verification";
              const isUnpaid = order.paymentStatus !== "paid";
              const canMark = isUnpaid && !["failed", "refunded", "delivered"].includes(order.status);
              const isMarking = marking === order.id;
              return (
                <tr
                  key={order.id}
                  className={`transition-colors ${isAwaiting ? "bg-amber-900/5 hover:bg-amber-900/10" : "hover:bg-gray-800/30"}`}
                >
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
                      {order.items.map((i) => i.variant ? `${i.product.name} — ${i.variant.name}` : i.product.name).join(", ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.paymentStatus === "paid"
                          ? "bg-green-600/20 text-green-400"
                          : isAwaiting
                          ? "bg-amber-600/25 text-amber-300 border border-amber-700/40"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {order.paymentStatus === "paid" ? "Payé" :
                         isAwaiting ? <><Clock className="h-3 w-3" /> Justificatif à vérifier</> :
                         "En attente"}
                      </span>
                      {order.loyaltyPointsUsed > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-600/20 text-purple-400 border border-purple-700/30">
                          Crédits fidélité ({order.loyaltyPointsUsed.toFixed(3)} DT)
                        </span>
                      )}
                      {order.paymentMethod && (
                        <p className="text-[10px] text-gray-500">
                          {METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                        </p>
                      )}
                      {isAwaiting && order.paymentProofUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                          <ImageIcon className="h-2.5 w-2.5" /> Preuve jointe
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {canMark && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-green-700/50 text-green-400 hover:bg-green-900/20 hover:text-green-300 text-xs"
                          disabled={isMarking}
                          onClick={() => markPaid(order.id)}
                        >
                          {isMarking
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <BadgeCheck className="h-3 w-3" />}
                          Marquer payé
                        </Button>
                      )}
                      <Link href={`/admin/commandes/${order.id}`}>
                        <Button
                          size="sm"
                          variant={isAwaiting ? "default" : order.status === "pending" || order.status === "processing" ? "default" : "ghost"}
                          className={`gap-1 ${isAwaiting ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                        >
                          Traiter <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Aucune commande{activeTab !== "all" ? " dans cette catégorie" : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
