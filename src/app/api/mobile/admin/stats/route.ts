import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const now = new Date();
  const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start7Days       = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalOrdersCount,
    paidOrdersCount,
    pendingOrders,
    awaitingVerification,
    deliveredOrders,
    totalRevenueAgg,
    todayRevenueAgg,
    monthRevenueAgg,
    lastMonthRevenueAgg,
    totalUsers,
    newUsersMonth,
    totalProducts,
    openTickets,
    last7DaysPaidOrders,
    methodStats,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] }, paymentStatus: "paid" } }),
    prisma.order.count({ where: { paymentStatus: "awaiting_verification" } }),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid", createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid", createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid", createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.order.findMany({
      where: { paymentStatus: "paid", createdAt: { gte: start7Days } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { paymentStatus: "paid" },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: {},
      select: {
        id: true, orderNumber: true, status: true, paymentStatus: true,
        paymentMethod: true, totalAmount: true, createdAt: true,
        user: { select: { email: true, name: true } },
        guestEmail: true,
        items: { select: { product: { select: { name: true } } }, take: 2 },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { keys: { where: { status: "available" }, select: { id: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalRevenue   = totalRevenueAgg._sum.totalAmount ?? 0;
  const todayRevenue   = todayRevenueAgg._sum.totalAmount ?? 0;
  const monthRevenue   = monthRevenueAgg._sum.totalAmount ?? 0;
  const lastMonthRevenue = lastMonthRevenueAgg._sum.totalAmount ?? 0;
  const revenueGrowth  = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : monthRevenue > 0 ? 100 : 0;
  const avgOrderValue  = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // 7-day daily revenue chart
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd   = new Date(dayStart.getTime() + 86400000);
    const dayOrders = last7DaysPaidOrders.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
    return {
      date: dayStart.toLocaleDateString("fr-TN", { weekday: "short", day: "numeric" }),
      revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0) * 100) / 100,
      orders: dayOrders.length,
    };
  });

  const lowStock = lowStockProducts
    .filter(p => p.keys.length <= p.lowStockAlert)
    .sort((a, b) => a.keys.length - b.keys.length)
    .slice(0, 6)
    .map(p => ({ id: p.id, name: p.name, stock: p.keys.length, alert: p.lowStockAlert }));

  return NextResponse.json({
    // Revenue
    totalRevenue,
    todayRevenue,
    monthRevenue,
    revenueGrowth,
    avgOrderValue,
    // Orders
    totalOrders: totalOrdersCount,
    paidOrdersCount,
    pendingOrders,
    awaitingVerification,
    deliveredOrders,
    // Users & products
    totalUsers,
    newUsersMonth,
    totalProducts,
    openTickets,
    // Charts
    dailyRevenue,
    methodBreakdown: methodStats.map(m => ({
      method: m.paymentMethod ?? "inconnu",
      count: m._count.id,
      revenue: m._sum.totalAmount ?? 0,
    })),
    // Lists
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toISOString(),
      customerEmail: o.user?.email ?? o.guestEmail ?? "Invité",
      products: o.items.map(i => i.product.name).join(", "),
    })),
    lowStock,
  });
}
