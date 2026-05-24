import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight } from "lucide-react";
import { VariantsEditorClient } from "./variants-editor-client";

export default async function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/produits" className="hover:text-gray-300">Produits</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/admin/produits/${id}/edit`} className="hover:text-gray-300 truncate max-w-40">{product.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300">Variantes</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Variantes</h1>
          <p className="text-sm text-gray-500 mt-1">{product.name}</p>
        </div>
      </div>

      <VariantsEditorClient productId={id} initialVariants={product.variants} />
    </div>
  );
}
