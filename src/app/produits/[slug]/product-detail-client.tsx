"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Zap, CheckCircle, Shield, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { SocialProof, ReviewCard } from "@/components/shared/social-proof";
import { UrgencyTimer } from "@/components/shared/urgency-timer";
import { UpsellSection } from "@/components/shared/upsell-section";
import { formatPrice, CATEGORIES } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/lib/use-toast";
import type { Product } from "@/types";

type UpsellProduct = Pick<Product, "id" | "name" | "slug" | "price" | "discountPrice" | "imageUrl" | "platform" | "category">;

type ExtProduct = Product & {
  availableKeys: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  urgencyHours?: number;
  productType?: string | null;
  accountPrice?: number | null;
  accountDiscountPrice?: number | null;
  accountDescription?: string | null;
};

type Props = {
  product: ExtProduct;
  upsells: UpsellProduct[];
};

const STATIC_REVIEWS = [
  { name: "Ahmed B.", rating: 5, text: "Clé reçue en moins de 20 minutes. Produit authentique, je recommande vivement !", date: "Il y a 2 jours", platform: "LootStore" },
  { name: "Rania M.", rating: 5, text: "Parfait ! Aucun problème d'activation. Le support répond rapidement sur WhatsApp.", date: "Il y a 5 jours", platform: "LootStore" },
  { name: "Karim T.", rating: 4, text: "Très bon service. La clé a fonctionné du premier coup. Livraison rapide.", date: "Il y a 1 semaine", platform: "LootStore" },
];

export function ProductDetailClient({ product, upsells }: Props) {
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();
  const inStock = product.availableKeys > 0;
  const categoryLabel = CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category;

  const productType = (product.productType ?? "key") as "key" | "account" | "both";
  const hasBoth = productType === "both";
  const [variant, setVariant] = useState<"key" | "account">(
    productType === "account" ? "account" : "key"
  );

  const isKeyVariant = variant === "key";
  const variantPrice = isKeyVariant
    ? product.price
    : (product.accountPrice ?? product.price);
  const variantDiscountPrice = isKeyVariant
    ? product.discountPrice
    : (product.accountDiscountPrice ?? null);

  const displayPrice = variantDiscountPrice ?? variantPrice;
  const hasDiscount = variantDiscountPrice && variantDiscountPrice < variantPrice;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        variant: hasBoth ? variant : undefined,
        name: hasBoth ? `${product.name} (${variant === "key" ? "Clé" : "Compte"})` : product.name,
        price: variantPrice,
        discountPrice: variantDiscountPrice,
        imageUrl: product.imageUrl,
        platform: product.platform,
        quantity: 1,
      });
    }
    toast({ title: "Ajouté au panier !", description: `${qty}x ${product.name}`, variant: "success" });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-300">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produits" className="hover:text-gray-300">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-video md:aspect-square bg-gray-800 rounded-2xl overflow-hidden">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🎮</div>
          )}
          {hasDiscount && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-lg">
              -{Math.round(((product.price - displayPrice) / product.price) * 100)}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformBadge platform={product.platform} />
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{categoryLabel}</span>
            <span className={`text-xs flex items-center gap-1 ${inStock ? "text-green-400" : "text-red-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-green-400" : "bg-red-400"}`} />
              {inStock ? `En stock (${product.availableKeys} dispo.)` : "Rupture de stock"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white">{product.name}</h1>

          {/* Social proof */}
          <SocialProof
            rating={product.rating}
            reviewCount={product.reviewCount}
            soldCount={product.soldCount}
          />

          {/* Variant selector — only shown when both key and account are available */}
          {hasBoth && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Type de produit</p>
              <div className="flex gap-2">
                {([
                  { value: "key" as const, label: "🔑 Clé / Code", price: product.price, discountPrice: product.discountPrice },
                  { value: "account" as const, label: "👤 Compte", price: product.accountPrice ?? 0, discountPrice: product.accountDiscountPrice },
                ]).map(({ value, label, price, discountPrice }) => {
                  const display = discountPrice ?? price;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVariant(value)}
                      className={`flex-1 rounded-xl border p-3 text-left transition-all ${
                        variant === value
                          ? "border-purple-500 bg-purple-900/30"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${variant === value ? "text-white" : "text-gray-300"}`}>
                        {label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-base font-bold text-white">{formatPrice(display)}</span>
                        {discountPrice && discountPrice < price && (
                          <span className="text-xs text-gray-500 line-through">{formatPrice(price)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">{formatPrice(variantPrice)}</span>
            )}
          </div>

          {(() => {
            const desc = isKeyVariant
              ? product.description
              : (product.accountDescription ?? product.description);
            return desc ? <p className="text-gray-400 text-sm leading-relaxed">{desc}</p> : null;
          })()}

          {/* Urgency timer */}
          {inStock && (product.urgencyHours ?? 4) > 0 && (
            <UrgencyTimer hours={product.urgencyHours ?? 4} label="Prix spécial expire dans" />
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "⚡", label: "15–60 min" },
              { icon: "🔒", label: "Paiement sécurisé" },
              { icon: "✅", label: productType === "account" ? "Compte garanti" : "Clé garantie" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg bg-gray-900 border border-gray-800 text-center">
                <span className="text-base sm:text-lg">{b.icon}</span>
                <span className="text-[10px] sm:text-xs text-gray-400 leading-tight">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Qty + CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-700 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-white font-semibold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.availableKeys || 10, qty + 1))}
                disabled={!inStock}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={!inStock}>
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </Button>
          </div>

          <Link href="/checkout" onClick={handleAddToCart}>
            <Button size="lg" variant="outline" className="w-full gap-2" disabled={!inStock}>
              <Zap className="h-5 w-5 text-yellow-400" />
              Acheter maintenant
            </Button>
          </Link>

          <p className="text-xs text-gray-600 pt-1">
            {productType === "account"
              ? "✓ Accès compte envoyé par email + espace client · ✓ Support 7j/7 · ✓ Paiement vérifié avant envoi"
              : "✓ Clé envoyée par email + espace client · ✓ Support 7j/7 · ✓ Paiement vérifié avant envoi"}
          </p>
        </div>
      </div>

      {/* Upsells */}
      {upsells.length > 0 && <UpsellSection products={upsells} />}

      {/* Reviews */}
      <div className="mt-10 pt-8 border-t border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Avis clients</h2>
            {product.reviewCount && product.reviewCount > 0 && (
              <p className="text-sm text-gray-500">{product.reviewCount} avis · Note moyenne : {product.rating?.toFixed(1)}/5</p>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {STATIC_REVIEWS.map((r) => (
            <ReviewCard key={r.name} {...r} />
          ))}
        </div>
      </div>
    </div>
  );
}
