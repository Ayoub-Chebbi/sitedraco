import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { Package, Key, ArrowRight, MessageCircle, Plus, Clock } from "lucide-react";
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

  const [orders, tickets] = await Promise.all([
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Commandes",  value: orders.length,       icon: <Package className="h-5 w-5 text-purple-400" />,       href: "/dashboard/commandes" },
          { label: "Total dépensé", value: formatPrice(totalSpent), icon: <Key className="h-5 w-5 text-purple-400" />,    href: "/dashboard/cles" },
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
