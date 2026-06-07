import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/upsells?productIds=id1,id2
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("productIds");
  if (!raw) return NextResponse.json([]);

  const productIds = raw.split(",").filter(Boolean).slice(0, 20);
  if (productIds.length === 0) return NextResponse.json([]);

  const upsells = await prisma.productUpsell.findMany({
    where: { productId: { in: productIds } },
    orderBy: { displayOrder: "asc" },
    include: {
      upsellProduct: {
        include: {
          _count: { select: { keys: { where: { status: "available" } } } },
        },
      },
    },
  });

  // Deduplicate by upsellProductId, exclude products already in cart
  const seen = new Set<string>();
  const results: { id: string; name: string; slug: string; price: number; discountPrice: number | null; imageUrl: string | null; platform: string; category: string; availableKeys: number }[] = [];

  for (const u of upsells) {
    const p = u.upsellProduct;
    if (seen.has(p.id)) continue;
    if (productIds.includes(p.id)) continue; // already in cart
    if (!p.isActive) continue;

    const availableKeys = p._count.keys + (p.manualStock ?? 0);
    if (availableKeys <= 0) continue;

    seen.add(p.id);
    results.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discountPrice,
      imageUrl: p.imageUrl,
      platform: p.platform,
      category: p.category,
      availableKeys,
    });
  }

  return NextResponse.json(results.slice(0, 6));
}
