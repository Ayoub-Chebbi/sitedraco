import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { AdminDashboard } from "./admin-metrics-client";

export const dynamic = "force-dynamic";

async function getMetrics() {
  const now = new Date();
  const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth= new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start7DaysAgo   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    // Revenue — only paid orders
    allTimePaidOrders,
    todayPaidOrders,
    monthPaidOrders,
    lastMonthPaidOrders,
    // Order counts
    totalOrders,
    paidOrdersCount,
    pendingOrders,
    awaitingVerification,
    deliveredOrders,
    // Users
    totalUsers,
    newUsersThisMonth,
    // Charts: last 7 days daily revenue
    last7DaysPaidOrders,
    // Payment method breakdown
    paymentMethodStats,
    // Top products
    topProducts,
    // Recent orders
    recentOrders,
    // Low stock
    lowStockProducts,
    // LTV — per-customer revenue aggregation
    ltvData,
  ] = await Promise.all([
    prisma.order.findMany({ where: { paymentStatus: "paid" }, select: { totalAmount: true } }),
    prisma.order.findMany({ where: { paymentStatus: "paid", paidAt: { gte: startOfToday } }, select: { totalAmount: true } }),
    prisma.order.findMany({ where: { paymentStatus: "paid", paidAt: { gte: startOfMonth } }, select: { totalAmount: true } }),
    prisma.order.findMany({ where: { paymentStatus: "paid", paidAt: { gte: startOfLastMonth, lt: startOfMonth } }, select: { totalAmount: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] }, paymentStatus: "paid" } }),
    prisma.order.count({ where: { paymentStatus: "awaiting_verification" } }),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      where: { paymentStatus: "paid", paidAt: { gte: start7DaysAgo } },
      select: { totalAmount: true, paidAt: true },
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { paymentStatus: "paid" },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
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
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { paymentStatus: "paid", userId: { not: null } },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
    }),
  ]);

  // Calculate revenues
  const totalRevenue    = allTimePaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const todayRevenue    = todayPaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const monthRevenue    = monthPaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const lastMonthRevenue= lastMonthPaidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueGrowth   = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : monthRevenue > 0 ? 100 : 0;
  const avgOrderValue   = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // Build 7-day chart
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOrders = last7DaysPaidOrders.filter(
      (o) => o.paidAt && o.paidAt >= dayStart && o.paidAt < dayEnd
    );
    dailyRevenue.push({
      date: dayStart.toLocaleDateString("fr-TN", { weekday: "short", day: "numeric" }),
      revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0) * 1000) / 1000,
      orders: dayOrders.length,
    });
  }

  // Payment method breakdown
  const methodBreakdown = paymentMethodStats.map((m) => ({
    method: m.paymentMethod ?? "inconnu",
    count: m._count.id,
    revenue: m._sum.totalAmount ?? 0,
  }));

  // LTV calculations
  const payingCustomers = ltvData.length; // unique customers who paid
  const avgLTV = payingCustomers > 0 ? totalRevenue / payingCustomers : 0;
  const repeatCustomers = ltvData.filter(c => (c._count.id ?? 0) > 1).length;
  const repeatRate = payingCustomers > 0 ? Math.round((repeatCustomers / payingCustomers) * 100) : 0;

  // Fetch names for top LTV customers
  const top5UserIds = ltvData.slice(0, 5).map(c => c.userId).filter(Boolean) as string[];
  const top5Users = await prisma.user.findMany({
    where: { id: { in: top5UserIds } },
    select: { id: true, name: true, email: true },
  });
  const topLTVCustomers = ltvData.slice(0, 5).map(c => {
    const u = top5Users.find(u => u.id === c.userId);
    return {
      email: u?.email ?? "Invité",
      name: u?.name ?? null,
      totalSpent: c._sum.totalAmount ?? 0,
      orderCount: c._count.id ?? 0,
    };
  });

  return {
    avgLTV,
    repeatRate,
    payingCustomers,
    topLTVCustomers,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    revenueGrowth,
    avgOrderValue,
    totalOrders,
    paidOrdersCount,
    pendingOrders,
    awaitingVerification,
    deliveredOrders,
    totalUsers,
    newUsersThisMonth,
    dailyRevenue,
    methodBreakdown,
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
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      customerEmail: o.user?.email || o.guestEmail || "Invité",
      products: o.items.map((i) => i.product.name).join(", "),
    })),
    lowStockProducts: lowStockProducts
      .filter((p) => p.keys.length <= p.lowStockAlert)
      .sort((a, b) => a.keys.length - b.keys.length)
      .slice(0, 8)
      .map((p) => ({ id: p.id, name: p.name, stock: p.keys.length, alert: p.lowStockAlert })),
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");
  if (session.user.role === "support") redirect("/admin/commandes");

  const metrics = await getMetrics();

  return (
    <AdminDashboard
      metrics={{
        ...metrics,
        totalRevenue: formatPrice(metrics.totalRevenue),
        todayRevenue: formatPrice(metrics.todayRevenue),
        monthRevenue: formatPrice(metrics.monthRevenue),
        avgOrderValue: formatPrice(metrics.avgOrderValue),
        avgLTV: formatPrice(metrics.avgLTV),
      }}
    />
  );
}
