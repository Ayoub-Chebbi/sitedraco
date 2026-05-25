import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./products-client";

const FALLBACK_CATEGORIES = [
  { slug: "game",         label: "Jeu complet" },
  { slug: "dlc",          label: "DLC" },
  { slug: "subscription", label: "Abonnement" },
  { slug: "credit",       label: "Crédit" },
  { slug: "giftcard",     label: "Carte cadeau" },
];

async function getProducts(platform?: string, category?: string, brand?: string) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(platform && { platform }),
      ...(category && { category }),
      ...(brand && { brand }),
    },
    include: {
      _count: { select: { keys: { where: { status: "available" } } } },
      variants: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
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

async function getGiftcardBrands(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, category: "giftcard", brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!).filter(Boolean);
}

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; category?: string; brand?: string }>;
}) {
  const params = await searchParams;
  const [products, categories, giftcardBrands] = await Promise.all([
    getProducts(params.platform, params.category, params.brand),
    getCategories(),
    getGiftcardBrands(),
  ]);
  const productsWithStock = products.map((p) => ({ ...p, availableKeys: p._count.keys + (p.manualStock ?? 0) }));

  return (
    <ProductsClient
      products={productsWithStock}
      categories={categories}
      giftcardBrands={giftcardBrands}
      initialPlatform={params.platform}
      initialCategory={params.category}
      initialBrand={params.brand}
    />
  );
}
