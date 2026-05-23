import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpsellEditorClient } from "./upsell-editor-client";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default async function UpsellsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;

  const [product, allProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        upsells: {
          include: {
            upsellProduct: {
              select: { id: true, name: true, slug: true, platform: true, price: true, discountPrice: true, imageUrl: true },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, NOT: { id } },
      select: { id: true, name: true, slug: true, platform: true, price: true, discountPrice: true, imageUrl: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  const initialUpsells = product.upsells.map((u) => ({
    id: u.id,
    displayOrder: u.displayOrder,
    upsellProduct: u.upsellProduct,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/produits" className="hover:text-gray-300">Produits</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[200px]">Upsells — {product.name}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/produits" className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Gestion des upsells</h1>
          <p className="text-sm text-gray-500">{product.name}</p>
        </div>
      </div>

      <UpsellEditorClient
        productId={product.id}
        productName={product.name}
        initialUpsells={initialUpsells}
        allProducts={allProducts}
      />
    </div>
  );
}
