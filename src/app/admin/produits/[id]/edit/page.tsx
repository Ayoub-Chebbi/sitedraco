import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { ChevronRight, Layers, Sparkles, Archive } from "lucide-react";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const initial = {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    accountDescription: product.accountDescription ?? "",
    platform: product.platform,
    category: product.category,
    brand: product.brand ?? "",
    productType: (product.productType ?? "key") as "key" | "account" | "both",
    requiresSteamUsername: product.requiresSteamUsername ?? false,
    price: product.price.toString(),
    discountPrice: product.discountPrice?.toString() ?? "",
    accountPrice: product.accountPrice?.toString() ?? "",
    accountDiscountPrice: product.accountDiscountPrice?.toString() ?? "",
    imageUrl: product.imageUrl ?? "",
    isActive: product.isActive,
    lowStockAlert: product.lowStockAlert.toString(),
    soldCount: product.soldCount.toString(),
    rating: product.rating.toString(),
    reviewCount: product.reviewCount.toString(),
    urgencyHours: product.urgencyHours.toString(),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/produits" className="hover:text-gray-300">Produits</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Modifier le produit</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/produits/${product.id}/stock`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Archive className="h-3 w-3" />
            Stock
          </Link>
          <Link
            href={`/admin/produits/${product.id}/variants`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Layers className="h-3 w-3" />
            Variantes
          </Link>
          <Link
            href={`/admin/produits/${product.id}/upsells`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Upsells
          </Link>
        </div>
      </div>
      <ProductForm mode="edit" productId={product.id} initial={initial} />
    </div>
  );
}
