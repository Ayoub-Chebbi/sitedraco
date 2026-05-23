import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    monthOrders,
    lastMonthOrders,
    totalRevenue,
    monthRevenue,
    totalUsers,
    newUsersMonth,
    totalProducts,
    openTickets,
    pendingOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: "paid", createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.order.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({
    totalOrders,
    monthOrders,
    lastMonthOrders,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    monthRevenue: monthRevenue._sum.totalAmount ?? 0,
    totalUsers,
    newUsersMonth,
    totalProducts,
    openTickets,
    pendingOrders,
  });
}
