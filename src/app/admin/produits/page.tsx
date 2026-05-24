import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Package, Plus, Edit2, Archive } from "lucide-react";

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Produits</h1>
            <p className="text-sm text-gray-500">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/admin/produits/nouveau">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Produit</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Prix</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Stock</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Upsells</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium" colSpan={3}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <tr
                key={product.id}
                className={`border-b border-gray-800/50 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30"} hover:bg-gray-900/60 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <PlatformBadge platform={product.platform} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {product.discountPrice ? (
                    <span>
                      <span className="text-white font-semibold">{formatPrice(product.discountPrice)}</span>
                      <span className="text-gray-600 line-through ml-1">{formatPrice(product.price)}</span>
                    </span>
                  ) : (
                    formatPrice(product.price)
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product._count.keys > 5 ? "bg-green-900/40 text-green-400" : product._count.keys > 0 ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                    {product._count.keys}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    {product._count.upsells}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/produits/${product.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    Modifier
                  </Link>
                </td>
                <td className="px-2 py-3 text-right">
                  <Link
                    href={`/admin/produits/${product.id}/stock`}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      product._count.keys === 0
                        ? "text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40"
                        : product._count.keys <= product.lowStockAlert
                        ? "text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40"
                        : "text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40"
                    }`}
                  >
                    <Archive className="h-3 w-3" />
                    Stock
                  </Link>
                </td>
                <td className="px-2 py-3 text-right">
                  <Link
                    href={`/admin/produits/${product.id}/upsells`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Upsells
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
