"use client";

import Link from "next/link";
import {
  ArrowRight, AlertTriangle, TrendingUp, TrendingDown, Users,
  ShoppingCart, AlertCircle, DollarSign, BarChart3, Clock, CheckCircle2,
  CreditCard, Smartphone, Building2, Repeat2, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice, formatDate } from "@/lib/utils";

type Metrics = {
  totalRevenue: string;
  todayRevenue: string;
  monthRevenue: string;
  revenueGrowth: number;
  avgOrderValue: string;
  avgLTV: string;
  repeatRate: number;
  payingCustomers: number;
  topLTVCustomers: { email: string; name: string | null; totalSpent: number; orderCount: number }[];
  totalOrders: number;
  paidOrdersCount: number;
  pendingOrders: number;
  awaitingVerification: number;
  deliveredOrders: number;
  totalUsers: number;
  newUsersThisMonth: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  methodBreakdown: { method: string; count: number; revenue: number }[];
  topProducts: { id: string; name: string; platform: string; sales: number; stock: number; price: number }[];
  recentOrders: { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string | null; totalAmount: number; createdAt: string; customerEmail: string; products: string }[];
  lowStockProducts: { id: string; name: string; stock: number; alert: number }[];
};

const METHOD_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  flouci:      { label: "Carte bancaire", icon: <CreditCard className="h-3.5 w-3.5" /> },
  d17:         { label: "D17",            icon: <Smartphone className="h-3.5 w-3.5" /> },
  flouci_app:  { label: "Flouci (app)",   icon: <Smartphone className="h-3.5 w-3.5" /> },
  virement:    { label: "Virement",       icon: <Building2 className="h-3.5 w-3.5" /> },
};

function SparkBar({ value, max, color = "bg-purple-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return <div className={`${color} rounded-sm w-full transition-all`} style={{ height: `${pct}%` }} />;
}

function KPICard({
  label, value, sub, positive, icon, href,
}: { label: string; value: string; sub: string; positive: boolean; icon: React.ReactNode; href?: string }) {
  const content = (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className={`text-xs mt-1.5 flex items-center gap-1 ${positive ? "text-green-400" : "text-red-400"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {sub}
      </p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function AdminDashboard({ metrics }: { metrics: Metrics }) {
  const maxRevenue = Math.max(...metrics.dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Statistiques basées sur les paiements confirmés uniquement</p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.awaitingVerification > 0 && (
            <Link href="/admin/commandes?status=awaiting_verification">
              <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-700/50 text-amber-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                <Clock className="h-4 w-4" />
                {metrics.awaitingVerification} justificatif{metrics.awaitingVerification > 1 ? "s" : ""} à vérifier
              </div>
            </Link>
          )}
          {metrics.pendingOrders > 0 && (
            <Link href="/admin/commandes">
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 px-3 py-1.5 rounded-lg text-sm font-medium animate-pulse">
                <AlertCircle className="h-4 w-4" />
                {metrics.pendingOrders} commande{metrics.pendingOrders > 1 ? "s" : ""} en attente
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Row 1 — Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KPICard
          label="Revenus ce mois"
          value={metrics.monthRevenue}
          sub={`${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth}% vs mois dernier`}
          positive={metrics.revenueGrowth >= 0}
          icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
        />
        <KPICard
          label="Revenus aujourd'hui"
          value={metrics.todayRevenue}
          sub="Paiements confirmés"
          positive={true}
          icon={<DollarSign className="h-4 w-4 text-green-400" />}
        />
        <KPICard
          label="Revenus total"
          value={metrics.totalRevenue}
          sub={`${metrics.paidOrdersCount} commandes payées`}
          positive={true}
          icon={<BarChart3 className="h-4 w-4 text-blue-400" />}
        />
        <KPICard
          label="Panier moyen"
          value={metrics.avgOrderValue}
          sub="Par commande payée"
          positive={true}
          icon={<ShoppingCart className="h-4 w-4 text-amber-400" />}
        />
      </div>

      {/* KPI Row 2 — Orders & Users */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Commandes payées"
          value={metrics.paidOrdersCount.toString()}
          sub={`${metrics.deliveredOrders} livrées`}
          positive={true}
          icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
          href="/admin/commandes"
        />
        <KPICard
          label="En attente livraison"
          value={metrics.pendingOrders.toString()}
          sub={metrics.pendingOrders === 0 ? "Tout est traité ✓" : "À traiter maintenant"}
          positive={metrics.pendingOrders === 0}
          icon={<AlertCircle className="h-4 w-4 text-red-400" />}
          href="/admin/commandes"
        />
        <KPICard
          label="À vérifier"
          value={metrics.awaitingVerification.toString()}
          sub="Justificatifs manuels"
          positive={metrics.awaitingVerification === 0}
          icon={<Clock className="h-4 w-4 text-amber-400" />}
          href="/admin/commandes"
        />
        <KPICard
          label="Clients"
          value={metrics.totalUsers.toString()}
          sub={`+${metrics.newUsersThisMonth} ce mois`}
          positive={true}
          icon={<Users className="h-4 w-4 text-purple-400" />}
          href="/admin/utilisateurs"
        />
      </div>

      {/* LTV row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <KPICard
          label="LTV moyen / client"
          value={metrics.avgLTV}
          sub={`${metrics.payingCustomers} clients payants`}
          positive={true}
          icon={<Crown className="h-4 w-4 text-yellow-400" />}
          href="/admin/utilisateurs"
        />
        <KPICard
          label="Taux de rétention"
          value={`${metrics.repeatRate}%`}
          sub="Clients avec 2+ commandes"
          positive={metrics.repeatRate > 20}
          icon={<Repeat2 className="h-4 w-4 text-green-400" />}
        />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-yellow-400" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Top clients LTV</p>
          </div>
          <div className="space-y-2">
            {metrics.topLTVCustomers.slice(0, 4).map((c, i) => (
              <div key={c.email} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{c.name ?? c.email}</p>
                  <p className="text-[10px] text-gray-600">{c.orderCount} commande{c.orderCount > 1 ? "s" : ""}</p>
                </div>
                <span className="text-xs font-bold text-purple-300 shrink-0">{formatPrice(c.totalSpent)}</span>
              </div>
            ))}
            {metrics.topLTVCustomers.length === 0 && (
              <p className="text-xs text-gray-600">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart (7 days) */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="font-semibold text-white mb-1 text-sm">Revenus — 7 derniers jours</h2>
          <p className="text-xs text-gray-600 mb-5">Paiements confirmés uniquement</p>
          <div className="flex items-end gap-2 h-32">
            {metrics.dailyRevenue.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <SparkBar
                    value={d.revenue}
                    max={maxRevenue}
                    color={d.revenue > 0 ? "bg-purple-500" : "bg-gray-800"}
                  />
                </div>
                <p className="text-[9px] text-gray-600 text-center leading-tight">{d.date}</p>
                {d.revenue > 0 && (
                  <p className="text-[9px] text-purple-400 font-semibold">{d.revenue.toFixed(0)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment method breakdown */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="font-semibold text-white mb-1 text-sm">Méthodes de paiement</h2>
          <p className="text-xs text-gray-600 mb-4">Commandes payées</p>
          {metrics.methodBreakdown.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {metrics.methodBreakdown.sort((a, b) => b.count - a.count).map((m) => {
                const info = METHOD_LABEL[m.method] ?? { label: m.method, icon: <CreditCard className="h-3.5 w-3.5" /> };
                const total = metrics.methodBreakdown.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                return (
                  <div key={m.method}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        {info.icon} {info.label}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{m.count}</span>
                        <span className="text-white font-semibold">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full">
                      <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{formatPrice(m.revenue)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white text-sm">Commandes récentes</h2>
            <Link href="/admin/commandes">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 text-xs">
                Toutes <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs text-gray-600 uppercase tracking-wider px-4 py-2.5">Commande</th>
                    <th className="text-left text-xs text-gray-600 uppercase tracking-wider px-4 py-2.5">Client</th>
                    <th className="text-left text-xs text-gray-600 uppercase tracking-wider px-4 py-2.5">Statut</th>
                    <th className="text-right text-xs text-gray-600 uppercase tracking-wider px-4 py-2.5">Montant</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {metrics.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <p className="font-mono text-xs text-gray-300">{order.orderNumber}</p>
                        <p className="text-xs text-gray-600">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-xs text-gray-300 truncate max-w-[120px]">{order.customerEmail}</p>
                        <p className="text-xs text-gray-600 truncate max-w-[120px]">{order.products}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="space-y-0.5">
                          <OrderStatusBadge status={order.status} />
                          {order.paymentStatus === "awaiting_verification" && (
                            <span className="block text-[10px] bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded-full w-fit">
                              Justificatif à vérifier
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-white text-sm">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/commandes/${order.id}`}>
                          <Button size="sm" variant="ghost" className="gap-1 text-purple-400 hover:text-purple-300 text-xs">
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
        <div className="space-y-5">
          {/* Low stock */}
          {metrics.lowStockProducts.length > 0 && (
            <div>
              <h2 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Alertes stock
              </h2>
              <div className="space-y-2">
                {metrics.lowStockProducts.map((p) => (
                  <Link key={p.id} href={`/admin/produits/${p.id}/stock`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-800/30 bg-yellow-900/10 hover:border-yellow-700/50 transition-colors">
                      <p className="text-xs text-gray-300 truncate max-w-[150px]">{p.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        p.stock === 0 ? "bg-red-600/20 text-red-400" : "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {p.stock === 0 ? "Rupture" : `${p.stock} dispo.`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top products */}
          <div>
            <h2 className="font-semibold text-white mb-3 text-sm">Top produits</h2>
            <div className="space-y-2">
              {metrics.topProducts.map((p, idx) => (
                <Link key={p.id} href={`/admin/produits/${p.id}/edit`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors">
                    <span className="w-5 text-xs font-bold text-gray-600 shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PlatformBadge platform={p.platform} />
                        <span className="text-xs text-gray-600">{p.sales} ventes</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-white">{formatPrice(p.price)}</p>
                      <p className={`text-[10px] ${p.stock === 0 ? "text-red-400" : "text-gray-600"}`}>
                        {p.stock === 0 ? "Rupture" : `${p.stock} stock`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
