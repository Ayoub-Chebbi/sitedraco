import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { StockClient } from "./stock-client";

export default async function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const keys = await prisma.productKey.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyValue: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      order: { select: { orderNumber: true } },
    },
  });

  const serialized = keys.map((k) => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    deliveredAt: k.deliveredAt?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/produits" className="hover:text-gray-300">Produits</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[160px]">{product.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300">Stock</span>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-1">Gestion du stock</h1>
      <p className="text-sm text-gray-500 mb-6">{product.name}</p>

      <StockClient
        productId={product.id}
        productName={product.name}
        keys={serialized}
      />
    </div>
  );
}
