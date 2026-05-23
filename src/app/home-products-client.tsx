"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { QuickViewModal } from "@/components/shared/quick-view-modal";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/lib/use-toast";
import type { Product } from "@/types";

type ExtProduct = Product & { availableKeys: number; soldCount?: number; rating?: number; reviewCount?: number };

export function HomeProductsClient({ products }: { products: ExtProduct[] }) {
  const [quickViewProduct, setQuickViewProduct] = useState<ExtProduct | null>(null);
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  function handleAddToCart(product: Product, variant?: "key" | "account") {
    const p = product as ExtProduct;
    const isAccount = variant === "account";
    const price = isAccount ? (p.accountPrice ?? product.price) : product.price;
    const discountPrice = isAccount ? (p.accountDiscountPrice ?? null) : product.discountPrice;
    addItem({
      productId: product.id,
      variant,
      name: variant ? `${product.name} (${variant === "key" ? "Clé" : "Compte"})` : product.name,
      price,
      discountPrice,
      imageUrl: product.imageUrl,
      platform: product.platform,
      quantity: 1,
    });
    toast({ title: "Ajouté au panier", description: product.name, variant: "success" });
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p as ExtProduct)}
          />
        ))}
      </div>
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
