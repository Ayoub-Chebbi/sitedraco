import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { platform: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      platform: true,
      price: true,
      discountPrice: true,
      imageUrl: true,
      category: true,
      _count: { select: { keys: { where: { status: "available" } } } },
    },
    take: 8,
    orderBy: { soldCount: "desc" },
  });

  return NextResponse.json(products);
}
