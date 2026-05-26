import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          keys: { where: { status: "available" } },
          upsells: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const productsWithStock = products.map((p) => ({
    ...p,
    totalStock: p._count.keys + (p.manualStock ?? 0),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Produits</h1>
            <p className="text-sm text-gray-500">{products.length} produit{products.length !== 1 ? "s" : ""} au total</p>
          </div>
        </div>
        <Link href="/admin/produits/nouveau">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      <ProductsClient products={productsWithStock} />
    </div>
  );
}
