import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(platform && { platform }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" }
    : sort === "price_desc" ? { price: "desc" }
    : sort === "popular" ? { soldCount: "desc" }
    : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { keys: { where: { status: "available" } } } } },
    }),
    prisma.product.count({ where }),
  ]);

  const productsWithStock = products.map((p) => ({
    ...p,
    availableKeys: p._count.keys + (p.manualStock ?? 0),
  }));

  return NextResponse.json({ products: productsWithStock, total, page, limit });
}
