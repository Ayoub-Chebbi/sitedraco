import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./products-client";

const FALLBACK_CATEGORIES = [
  { slug: "game",         label: "Jeu complet" },
  { slug: "dlc",          label: "DLC" },
  { slug: "subscription", label: "Abonnement" },
  { slug: "credit",       label: "Crédit" },
  { slug: "giftcard",     label: "Carte cadeau" },
];

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

async function getCategories() {
  const cats = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    select: { slug: true, label: true },
  });
  return cats.length > 0 ? cats : FALLBACK_CATEGORIES;
}

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(params.platform, params.category),
    getCategories(),
  ]);
  const productsWithStock = products.map((p) => ({ ...p, availableKeys: p._count.keys + (p.manualStock ?? 0) }));

  return (
    <ProductsClient
      products={productsWithStock}
      categories={categories}
      initialPlatform={params.platform}
      initialCategory={params.category}
    />
  );
}
