"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShoppingCart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/lib/use-toast";
import type { Product } from "@/types";

type UpsellProduct = Pick<Product, "id" | "name" | "slug" | "price" | "discountPrice" | "imageUrl" | "platform" | "category">;

type Props = {
  products: UpsellProduct[];
  title?: string;
};

export function UpsellSection({ products, title = "On complète votre commande ?" }: Props) {
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  if (products.length === 0) return null;

  function handleAdd(p: UpsellProduct) {
    addItem({
      productId: p.id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice,
      imageUrl: p.imageUrl,
      platform: p.platform,
      quantity: 1,
    });
    toast({ title: "Ajouté au panier !", description: p.name, variant: "success" });
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => {
          const price = p.discountPrice ?? p.price;
          const hasDiscount = p.discountPrice && p.discountPrice < p.price;
          return (
            <div key={p.id} className="flex gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 transition-colors">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <PlatformBadge platform={p.platform} />
                <Link href={`/produits/${p.slug}`}>
                  <p className="text-sm font-semibold text-gray-200 truncate hover:text-purple-300 mt-1">{p.name}</p>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{formatPrice(price)}</span>
                    {hasDiscount && <span className="text-xs text-gray-500 line-through">{formatPrice(p.price)}</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 gap-1 text-xs"
                    onClick={() => handleAdd(p)}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
