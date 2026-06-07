import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Package, Key, ArrowRight, MessageCircle, Plus, Clock, AlertCircle, ExternalLink, Gift, TrendingUp, Users } from "lucide-react";
import { CopyReferralCode } from "./copy-referral-code";
import { Button } from "@/components/ui/button";

const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouvert",    color: "bg-yellow-900/40 text-yellow-400 border border-yellow-700/40" },
  in_progress: { label: "En cours", color: "bg-blue-900/40 text-blue-400 border border-blue-700/40" },
  resolved:    { label: "Résolu",   color: "bg-green-900/40 text-green-400 border border-green-700/40" },
  closed:      { label: "Fermé",    color: "bg-gray-800 text-gray-500 border border-gray-700" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const [orders, tickets, pendingOrders, loyaltyData] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { message: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.order.findMany({
      where: {
        userId: session.user.id,
        paymentStatus: "awaiting_payment",
        paymentUrl: { not: null },
        // Only show orders initiated in the last 2 hours (Flouci links expire)
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        referralCode: true,
        loyaltyTransactions: { orderBy: { createdAt: "desc" }, take: 5, select: { type: true, amount: true, description: true, createdAt: true } },
        referralsMade: { select: { status: true, rewardGiven: true }, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {session.user.name || session.user.email?.split("@")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenue dans votre espace client</p>
      </div>

      {/* Pending payment banners */}
      {pendingOrders.length > 0 && (
        <div className="space-y-3 mb-6">
          {pendingOrders.map((po) => (
            <div key={po.id} className="flex items-center gap-4 rounded-xl border border-yellow-700/50 bg-yellow-900/10 px-5 py-4">
              <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-300">Paiement en attente</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Commande <span className="font-mono text-white">{po.orderNumber}</span>
                  {" · "}
                  {po.items.map((i) => i.product.name).join(", ")}
                  {" · "}
                  <span className="text-white font-semibold">{formatPrice(po.totalAmount)}</span>
                </p>
              </div>
              <a
                href={po.paymentUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                Compléter le paiement
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Commandes",  value: orders.length,       icon: <Package className="h-5 w-5 text-purple-400" />,       href: "/dashboard/commandes" },
          { label: "Total dépensé", value: formatPrice(totalSpent), icon: <TrendingUp className="h-5 w-5 text-purple-400" />, href: "/dashboard/commandes" },
          { label: "Tickets ouverts", value: openTickets,    icon: <MessageCircle className="h-5 w-5 text-yellow-400" />, href: "/dashboard/support" },
          { label: "Mes clés",   value: "Voir",              icon: <Key className="h-5 w-5 text-green-400" />,            href: "/dashboard/cles" },
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

      {/* Loyalty card */}
      {(loyaltyData?.loyaltyPoints ?? 0) >= 0 && (
        <div className="mb-8 rounded-2xl border border-yellow-700/40 bg-yellow-950/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Gift className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Programme de fidélité</p>
                <p className="text-xs text-gray-500">1% de cashback sur chaque commande payée</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-yellow-300">{(loyaltyData?.loyaltyPoints ?? 0).toFixed(3)} TND</p>
              <p className="text-xs text-gray-500">solde disponible</p>
            </div>
          </div>
          {(loyaltyData?.loyaltyTransactions?.length ?? 0) > 0 && (
            <div className="border-t border-yellow-800/30 px-5 py-3 space-y-2">
              {loyaltyData!.loyaltyTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{t.description}</span>
                  <span className={`font-semibold ${t.type === "earned" ? "text-green-400" : "text-red-400"}`}>
                    {t.type === "earned" ? "+" : "-"}{t.amount.toFixed(3)} TND
                  </span>
                </div>
              ))}
            </div>
          )}
          {(loyaltyData?.loyaltyPoints ?? 0) > 0 && (
            <div className="border-t border-yellow-800/30 px-5 py-3">
              <Link href="/checkout">
                <span className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                  Utiliser mes points au prochain achat →
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Referral card */}
      <div className="mb-8 rounded-2xl border border-pink-700/40 bg-pink-950/10 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Parrainez vos amis</p>
              <p className="text-xs text-gray-500">Ils ont -5% · Vous gagnez 2 TND fidélité par parrainage complété</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {loyaltyData?.referralCode
              ? <CopyReferralCode code={loyaltyData.referralCode} />
              : <span className="text-xs text-gray-500 italic">Code généré à votre premier accès</span>
            }
          </div>
        </div>
        {(loyaltyData?.referralsMade?.length ?? 0) > 0 && (
          <div className="border-t border-pink-800/30 px-5 py-3 flex items-center gap-6 text-sm">
            <div>
              <span className="text-white font-bold">{loyaltyData!.referralsMade.filter(r => r.status === "completed").length}</span>
              <span className="text-gray-500 ml-1.5">parrainages complétés</span>
            </div>
            <div>
              <span className="text-pink-300 font-bold">{loyaltyData!.referralsMade.reduce((s, r) => s + r.rewardGiven, 0).toFixed(0)} TND</span>
              <span className="text-gray-500 ml-1.5">gagnés</span>
            </div>
            {loyaltyData!.referralsMade.some(r => r.status === "pending") && (
              <div>
                <span className="text-yellow-400 font-bold">{loyaltyData!.referralsMade.filter(r => r.status === "pending").length}</span>
                <span className="text-gray-500 ml-1.5">en attente</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
            <div className="text-center py-10 rounded-xl border border-gray-800 bg-gray-900">
              <Package className="h-8 w-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucune commande</p>
              <Link href="/produits" className="mt-3 inline-block">
                <Button size="sm">Parcourir le catalogue</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link key={order.id} href={`/commande/${order.orderNumber}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-gray-300">{order.orderNumber}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {order.items.map((i) => i.product.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{formatPrice(order.totalAmount)}</p>
                      <p className="text-xs text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Support tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">Mes tickets</h2>
              {openTickets > 0 && (
                <span className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700/40 px-2 py-0.5 rounded-full">
                  {openTickets} ouvert{openTickets > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/support/nouveau">
                <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
                  <Plus className="h-3 w-3" /> Nouveau
                </Button>
              </Link>
              <Link href="/dashboard/support">
                <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
                  Tout voir <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-gray-800 bg-gray-900">
              <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun ticket de support</p>
              <Link href="/dashboard/support/nouveau" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Créer un ticket
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const sc = TICKET_STATUS[t.status] ?? TICKET_STATUS.open;
                const isOpen = t.status === "open" || t.status === "in_progress";
                return (
                  <Link key={t.id} href={`/dashboard/support/${t.id}`}>
                    <div className={`flex items-start gap-3 p-3 rounded-xl border bg-gray-900 hover:bg-gray-800/50 transition-colors ${isOpen ? "border-yellow-800/30" : "border-gray-800"}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isOpen ? "bg-yellow-400" : "bg-gray-600"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatDate(t.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                        {t.messages[0] && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{t.messages[0].message}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 shrink-0">{t._count.messages} msg</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
