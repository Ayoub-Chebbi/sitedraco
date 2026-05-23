import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Keys are display names shown in the app; values are DB platform slugs.
const PLATFORMS: Record<string, string> = {
  PlayStation: "ps5",
  Xbox: "xbox",
  PC: "pc",
  Steam: "steam",
  Mobile: "mobile",
};

export async function GET() {
  const include = { _count: { select: { keys: { where: { status: "available" } } } } } as const;

  const [newArrivals, deals, ...platformProducts] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 10, include }),
    prisma.product.findMany({ where: { isActive: true, discountPrice: { not: null } }, orderBy: { soldCount: "desc" }, take: 10, include }),
    ...Object.values(PLATFORMS).map((slug) =>
      prisma.product.findMany({ where: { isActive: true, platform: slug }, orderBy: { soldCount: "desc" }, take: 8, include })
    ),
  ]);

  const platformKeys = Object.keys(PLATFORMS);
  const platforms = Object.fromEntries(platformKeys.map((name, i) => [name, platformProducts[i]]));

  return NextResponse.json({ newArrivals, deals, platforms });
}
