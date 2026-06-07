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

function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Il y a 1 jour";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 14) return "Il y a 1 semaine";
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 60) return "Il y a 1 mois";
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, rawReviews] = await Promise.all([
    prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        _count: { select: { keys: { where: { status: "available" } } } },
        variants: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
        upsells: {
          orderBy: { displayOrder: "asc" },
          include: {
            upsellProduct: {
              include: { _count: { select: { keys: { where: { status: "available" } } } } },
            },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { product: { slug } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        order: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  if (!product) notFound();

  const reviews = rawReviews.map((r) => ({
    id: r.id,
    name: r.order.user?.name ?? "Client vérifié",
    rating: r.rating,
    text: r.comment ?? "",
    date: formatRelativeDate(r.createdAt),
  }));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : undefined;

  const upsellProducts = product.upsells.map((u) => ({
    ...u.upsellProduct,
    availableKeys: u.upsellProduct._count.keys + (u.upsellProduct.manualStock ?? 0),
  }));

  return (
    <ProductDetailClient
      product={{
        ...product,
        availableKeys: product._count.keys + (product.manualStock ?? 0),
        rating: avgRating ?? product.rating,
        reviewCount: reviews.length,
      }}
      upsells={upsellProducts}
      reviews={reviews}
    />
  );
}
