import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminMetricsClient } from "./admin-metrics-client";
import { TrendingUp, Users, ShoppingCart, AlertCircle } from "lucide-react";
import Link from "next/link";

async function getMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    monthOrders,
    lastMonthOrders,
    totalUsers,
    newUsersThisMonth,
    topProducts,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] } } }),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth }, status: "delivered" },
      select: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: "delivered" },
      select: { totalAmount: true },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: startOfMonth } } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { orderItems: true } },
        keys: { where: { status: "available" }, select: { id: true } },
      },
      orderBy: { orderItems: { _count: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { keys: { where: { status: "available" }, select: { id: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const monthRevenue = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 100;

  return {
    monthRevenue,
    revenueGrowth,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalUsers,
    newUsersThisMonth,
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      sales: p._count.orderItems,
      stock: p.keys.length,
      price: p.discountPrice ?? p.price,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      customerEmail: o.user?.email || o.guestEmail || "Invité",
      products: o.items.map((i) => i.product.name).join(", "),
    })),
    lowStockProducts: lowStockProducts
      .filter((p) => p.keys.length <= p.lowStockAlert)
      .map((p) => ({ id: p.id, name: p.name, stock: p.keys.length, alert: p.lowStockAlert })),
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const metrics = await getMetrics();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble des opérations</p>
        </div>
        {metrics.pendingOrders > 0 && (
          <Link href="/admin/commandes">
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-2 rounded-xl animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">{metrics.pendingOrders} commande{metrics.pendingOrders > 1 ? "s" : ""} en attente</span>
            </div>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Revenus ce mois",
            value: formatPrice(metrics.monthRevenue),
            sub: `${metrics.revenueGrowth >= 0 ? "+" : ""}${metrics.revenueGrowth}% vs mois dernier`,
            positive: metrics.revenueGrowth >= 0,
            icon: <TrendingUp className="h-5 w-5 text-purple-400" />,
          },
          {
            label: "Commandes totales",
            value: metrics.totalOrders.toString(),
            sub: `${metrics.deliveredOrders} livrées`,
            positive: true,
            icon: <ShoppingCart className="h-5 w-5 text-purple-400" />,
          },
          {
            label: "Clients",
            value: metrics.totalUsers.toString(),
            sub: `+${metrics.newUsersThisMonth} ce mois`,
            positive: true,
            icon: <Users className="h-5 w-5 text-purple-400" />,
          },
          {
            label: "En attente",
            value: metrics.pendingOrders.toString(),
            sub: "À traiter maintenant",
            positive: metrics.pendingOrders === 0,
            icon: <AlertCircle className="h-5 w-5 text-purple-400" />,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{kpi.label}</p>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className={`text-xs mt-1 ${kpi.positive ? "text-green-400" : "text-red-400"}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <AdminMetricsClient
        topProducts={metrics.topProducts}
        recentOrders={metrics.recentOrders}
        lowStockProducts={metrics.lowStockProducts}
      />
    </div>
  );
}
