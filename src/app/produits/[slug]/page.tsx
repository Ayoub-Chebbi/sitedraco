import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { ProductDetailClient } from "./product-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    getSiteSettings(),
  ]);
  if (!product) return {};

  const description =
    product.description ||
    `Achetez ${product.name} au meilleur prix sur ${settings.siteName}. Livraison rapide en Tunisie.`;
  const images = product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }] : [];

  return {
    title: product.name,
    description,
    openGraph: {
      type: "website",
      title: `${product.name} | ${settings.siteName}`,
      description,
      images,
      siteName: settings.siteName,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: `${product.name} | ${settings.siteName}`,
      description,
      images: images.map((i) => i.url),
    },
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
