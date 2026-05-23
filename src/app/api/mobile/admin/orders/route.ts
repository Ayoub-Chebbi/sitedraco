import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(since ? { createdAt: { gt: new Date(since) } } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}
