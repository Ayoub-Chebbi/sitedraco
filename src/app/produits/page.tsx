import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./products-client";

async function getProducts(platform?: string, category?: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(platform && { platform }),
      ...(category && { category }),
    },
    include: {
      _count: { select: { keys: { where: { status: "available" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; category?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts(params.platform, params.category);
  const productsWithStock = products.map((p) => ({ ...p, availableKeys: p._count.keys }));

  return <ProductsClient products={productsWithStock} initialPlatform={params.platform} initialCategory={params.category} />;
}
