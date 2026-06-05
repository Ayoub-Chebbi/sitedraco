export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, ImageIcon, Search } from "lucide-react";

const METHOD_LABEL: Record<string, string> = {
  flouci:     "Carte bancaire",
  d17:        "D17",
  flouci_app: "Flouci",
  virement:   "Virement",
};

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const params = await searchParams;
  const statusFilter  = params.status  || "all";
  const paymentFilter = params.payment || "";
  const query         = (params.q || "").trim();

  // Build where clause — search takes priority over status/payment filters
  const searchWhere = query ? {
    OR: [
      { orderNumber: { contains: query, mode: "insensitive" as const } },
      { user: { email: { contains: query, mode: "insensitive" as const } } },
      { user: { name: { contains: query, mode: "insensitive" as const } } },
      { guestEmail: { contains: query, mode: "insensitive" as const } },
    ],
  } : null;

  const statusWhere =
    paymentFilter === "awaiting_verification"
      ? { paymentStatus: "awaiting_verification", NOT: { status: "failed" } }
      : statusFilter === "failed"
      ? { OR: [{ status: "failed" }, { status: { not: "failed" }, paymentStatus: "failed" }] }
      : statusFilter !== "all"
      ? { status: statusFilter }
      : null;

  const where = searchWhere && statusWhere
    ? { AND: [searchWhere, statusWhere] }
    : searchWhere ?? statusWhere ?? undefined;

  const [orders, awaitingCount] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentProofUrl: true,
        totalAmount: true,
        guestEmail: true,
        createdAt: true,
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where: { paymentStatus: "awaiting_verification", NOT: { status: "failed" } } }),
  ]);

  const activeTab = paymentFilter === "awaiting_verification" ? "verif" : statusFilter;

  const TABS = [
    { value: "all",        label: "Toutes",         href: "/admin/commandes" },
    { value: "verif",      label: `À vérifier${awaitingCount > 0 ? ` (${awaitingCount})` : ""}`, href: "/admin/commandes?payment=awaiting_verification", amber: true },
    { value: "pending",    label: "En attente",      href: "/admin/commandes?status=pending" },
    { value: "processing", label: "En traitement",   href: "/admin/commandes?status=processing" },
    { value: "delivered",  label: "Livrées",         href: "/admin/commandes?status=delivered" },
    { value: "failed",     label: "Échouées",        href: "/admin/commandes?status=failed" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">Admin</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Commandes</h1>
        <span className="text-gray-500 text-sm">({orders.length})</span>
      </div>

      {/* Search bar */}
      <form method="GET" action="/admin/commandes" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            name="q"
            defaultValue={query}
            placeholder="N° commande ou email client…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
          {query && (
            <Link
              href="/admin/commandes"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              ✕
            </Link>
          )}
        </div>
        {query && (
          <p className="text-xs text-gray-500 mt-2">
            {orders.length} résultat{orders.length !== 1 ? "s" : ""} pour « {query} »
          </p>
        )}
      </form>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <Link key={tab.value} href={tab.href}>
            <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? tab.amber
                  ? "bg-amber-600 text-white"
                  : "bg-purple-600 text-white"
                : tab.amber && awaitingCount > 0
                ? "text-amber-400 hover:text-white hover:bg-amber-800/40"
                : "text-gray-400 hover:text-white"
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
              {orders.map((order) => {
                const isAwaiting = order.paymentStatus === "awaiting_verification";
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
                        {order.items.map((i) => i.product.name).join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {/* Payment status badge */}
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

                        {/* Payment method */}
                        {order.paymentMethod && (
                          <p className="text-[10px] text-gray-500">
                            {METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                          </p>
                        )}

                        {/* Proof indicator */}
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
                      <Link href={`/admin/commandes/${order.id}`}>
                        <Button
                          size="sm"
                          variant={isAwaiting ? "default" : order.status === "pending" || order.status === "processing" ? "default" : "ghost"}
                          className={`gap-1 ${isAwaiting ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                        >
                          Traiter <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
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
    </div>
  );
}
