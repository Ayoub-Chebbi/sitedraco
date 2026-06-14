import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "week";
  const now = new Date();

  let start: Date;
  let end: Date;

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  } else if (period === "yesterday") {
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else {
    // week — last 7 days
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "paid",
      OR: [
        { paidAt: { gte: start, lt: end } },
        { paidAt: null, createdAt: { gte: start, lt: end } },
      ],
    },
    select: { totalAmount: true, paidAt: true, createdAt: true },
  });

  const totalRevenue = Math.round(orders.reduce((s, o) => s + o.totalAmount, 0) * 1000) / 1000;
  const totalOrders = orders.length;

  let bars: { label: string; revenue: number; orders: number }[];

  if (period === "today" || period === "yesterday") {
    // 24 hourly bars
    bars = Array.from({ length: 24 }, (_, h) => {
      const hourOrders = orders.filter((o) => {
        const t = o.paidAt ?? o.createdAt;
        return t.getHours() === h;
      });
      return {
        label: `${h}h`,
        revenue: Math.round(hourOrders.reduce((s, o) => s + o.totalAmount, 0) * 1000) / 1000,
        orders: hourOrders.length,
      };
    });
  } else if (period === "week") {
    // 7 daily bars
    bars = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = orders.filter((o) => {
        const t = o.paidAt ?? o.createdAt;
        return t >= dayStart && t < dayEnd;
      });
      return {
        label: dayStart.toLocaleDateString("fr-TN", { weekday: "short", day: "numeric" }),
        revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0) * 1000) / 1000,
        orders: dayOrders.length,
      };
    });
  } else {
    // month — one bar per day
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    bars = Array.from({ length: daysInMonth }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = orders.filter((o) => {
        const t = o.paidAt ?? o.createdAt;
        return t >= dayStart && t < dayEnd;
      });
      return {
        label: `${i + 1}`,
        revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0) * 1000) / 1000,
        orders: dayOrders.length,
      };
    });
  }

  return NextResponse.json({ totalRevenue, totalOrders, bars });
}
