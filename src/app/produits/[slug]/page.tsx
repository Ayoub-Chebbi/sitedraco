import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./product-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return {};
  return {
    title: `${product.name} — LootStore`,
    description: product.description || `Achetez ${product.name} au meilleur prix sur LootStore.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      _count: { select: { keys: { where: { status: "available" } } } },
      upsells: {
        orderBy: { displayOrder: "asc" },
        include: {
          upsellProduct: {
            include: { _count: { select: { keys: { where: { status: "available" } } } } },
          },
        },
      },
    },
  });

  if (!product) notFound();

  const upsellProducts = product.upsells.map((u) => ({
    ...u.upsellProduct,
    availableKeys: u.upsellProduct._count.keys,
  }));

  return (
    <ProductDetailClient
      product={{ ...product, availableKeys: product._count.keys }}
      upsells={upsellProducts}
    />
  );
}
