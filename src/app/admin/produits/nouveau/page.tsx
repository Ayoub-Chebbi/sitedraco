import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";
import { ChevronRight } from "lucide-react";

export default async function NewProductPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/produits" className="hover:text-gray-300">Produits</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300">Nouveau produit</span>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-6">Créer un produit</h1>
      <ProductForm mode="create" />
    </div>
  );
}
