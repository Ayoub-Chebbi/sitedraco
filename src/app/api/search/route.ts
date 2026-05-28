import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { platform: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      _count: { select: { keys: { where: { status: "available" } } } },
      variants: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, price: true, discountPrice: true, displayOrder: true },
      },
    },
    take: 8,
    orderBy: { soldCount: "desc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      platform: p.platform,
      price: p.price,
      discountPrice: p.discountPrice,
      imageUrl: p.imageUrl,
      category: p.category,
      availableKeys: p._count.keys + (p.manualStock ?? 0),
      variants: p.variants,
    }))
  );
}
