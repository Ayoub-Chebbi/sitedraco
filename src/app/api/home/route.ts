import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_PLATFORMS = [
  { value: "ps5", label: "PlayStation 5" },
  { value: "xbox", label: "Xbox" },
  { value: "pc", label: "PC" },
  { value: "steam", label: "Steam" },
  { value: "mobile", label: "Mobile" },
];

export async function GET() {
  const include = {
    _count: { select: { keys: { where: { status: "available" } } } },
    variants: { where: { isActive: true }, orderBy: { displayOrder: "asc" as const }, select: { id: true, name: true, price: true, discountPrice: true, displayOrder: true } },
  } as const;

  const dbPlatforms = await prisma.platform.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    select: { value: true, label: true },
  });
  const platformList = dbPlatforms.length > 0 ? dbPlatforms : FALLBACK_PLATFORMS;

  const [newArrivals, deals, ...platformProducts] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 10, include }),
    prisma.product.findMany({ where: { isActive: true, discountPrice: { not: null } }, orderBy: { soldCount: "desc" }, take: 10, include }),
    ...platformList.map(({ value }) =>
      prisma.product.findMany({ where: { isActive: true, platform: value }, orderBy: { soldCount: "desc" }, take: 8, include })
    ),
  ]);

  const addStock = (p: any) => ({ ...p, availableKeys: p._count.keys + (p.manualStock ?? 0) });

  const platforms = Object.fromEntries(
    platformList.map(({ value }, i) => [value, platformProducts[i].map(addStock)])
  );

  return NextResponse.json({
    newArrivals: newArrivals.map(addStock),
    deals: deals.map(addStock),
    platforms,
  });
}
