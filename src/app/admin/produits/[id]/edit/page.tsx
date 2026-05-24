import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { ChevronRight } from "lucide-react";

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
    productType: (product.productType ?? "key") as "key" | "account" | "both",
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

      <h1 className="text-2xl font-bold text-white mb-6">Modifier le produit</h1>
      <ProductForm mode="edit" productId={product.id} initial={initial} />
    </div>
  );
}
