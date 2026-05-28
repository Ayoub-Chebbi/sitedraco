"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type ProductVariant = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  displayOrder: number;
};

type UpsellProduct = Pick<Product, "id" | "name" | "slug" | "price" | "discountPrice" | "imageUrl" | "platform" | "category">;

type ExtProduct = Product & {
  availableKeys: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  urgencyHours?: number;
  productType?: string | null;
  requiresSteamUsername?: boolean | null;
  accountPrice?: number | null;
  accountDiscountPrice?: number | null;
  accountDescription?: string | null;
  variants?: ProductVariant[];
};

type Props = {
  product: ExtProduct;
  upsells: UpsellProduct[];
};

const STATIC_REVIEWS = [
  { name: "Ahmed B.", rating: 5, text: "Clé reçue en moins de 20 minutes. Produit authentique, je recommande vivement !", date: "Il y a 2 jours", platform: "LootStore" },
  { name: "Rania M.", rating: 5, text: "Parfait ! Aucun problème d'activation. Le support a traité mon ticket en moins d'une heure.", date: "Il y a 5 jours", platform: "LootStore" },
  { name: "Karim T.", rating: 4, text: "Très bon service. La clé a fonctionné du premier coup. Livraison rapide.", date: "Il y a 1 semaine", platform: "LootStore" },
];

export function ProductDetailClient({ product, upsells }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();
  const inStock = product.availableKeys > 0;
  const categoryLabel = CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category;

  const productType = (product.productType ?? "key") as "key" | "account" | "both";
  const hasBoth = productType === "both";
  const hasVariants = (product.variants?.length ?? 0) > 0;

  // Key/account selector (only when no custom variants)
  const [variant, setVariant] = useState<"key" | "account">(
    productType === "account" ? "account" : "key"
  );

  // Custom variant selector (gift cards etc.)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null
  );
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) ?? product.variants?.[0];

  // Price calculation
  let displayPrice: number;
  let originalPrice: number;
  let hasDiscount: boolean;

  if (hasVariants && selectedVariant) {
    originalPrice = selectedVariant.price;
    displayPrice = selectedVariant.discountPrice ?? selectedVariant.price;
    hasDiscount = !!(selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price);
  } else {
    const isKeyVariant = variant === "key";
    originalPrice = isKeyVariant ? product.price : (product.accountPrice ?? product.price);
    const variantDiscountPrice = isKeyVariant
      ? product.discountPrice
      : (product.accountDiscountPrice ?? null);
    displayPrice = variantDiscountPrice ?? originalPrice;
    hasDiscount = !!(variantDiscountPrice && variantDiscountPrice < originalPrice);
  }

  const description = hasVariants
    ? product.description
    : variant === "key"
      ? product.description
      : (product.accountDescription ?? product.description);

  const needsSteam = product.requiresSteamUsername ?? false;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      if (hasVariants && selectedVariant) {
        addItem({
          productId: product.id,
          variantId: selectedVariant.id,
          variantName: selectedVariant.name,
          name: `${product.name} — ${selectedVariant.name}`,
          price: selectedVariant.price,
          discountPrice: selectedVariant.discountPrice,
          imageUrl: product.imageUrl,
          platform: product.platform,
          quantity: 1,
          requiresSteamUsername: needsSteam,
        });
      } else {
        addItem({
          productId: product.id,
          variant: hasBoth ? variant : undefined,
          name: hasBoth ? `${product.name} (${variant === "key" ? "Clé" : "Compte"})` : product.name,
          price: originalPrice,
          discountPrice: hasDiscount ? displayPrice : undefined,
          imageUrl: product.imageUrl,
          platform: product.platform,
          quantity: 1,
          requiresSteamUsername: needsSteam,
        });
      }
    }
    const label = hasVariants && selectedVariant
      ? `${qty}x ${product.name} — ${selectedVariant.name}`
      : `${qty}x ${product.name}`;
    toast({ title: "Ajouté au panier !", description: label, variant: "success" });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-300">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produits" className="hover:text-gray-300">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-50">{product.name}</span>
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
              -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
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

          <SocialProof
            rating={product.rating}
            reviewCount={product.reviewCount}
            soldCount={product.soldCount}
          />

          {/* Custom variant selector (gift cards / denominations) */}
          {hasVariants && product.variants && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Choisir un montant</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const display = v.discountPrice ?? v.price;
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-xl border-2 p-3 text-center transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-900/30"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <p className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-300"}`}>{v.name}</p>
                      <p className="text-base font-bold text-purple-300 mt-0.5">{formatPrice(display)}</p>
                      {v.discountPrice && v.discountPrice < v.price && (
                        <p className="text-xs text-gray-500 line-through">{formatPrice(v.price)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key/account selector — only when no custom variants */}
          {!hasVariants && hasBoth && (
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
              <span className="text-lg text-gray-500 line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>

          {description && <p className="text-gray-400 text-sm leading-relaxed">{description}</p>}

          {inStock && (product.urgencyHours ?? 4) > 0 && (
            <UrgencyTimer hours={product.urgencyHours ?? 4} label="Prix spécial expire dans" />
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "⚡", label: "15–60 min" },
              { icon: "🔒", label: "Sécurisé" },
              { icon: "✅", label: productType === "account" ? "Garanti" : "Garanti" },
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
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!inStock || (hasVariants && !selectedVariant)}
            >
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </Button>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            disabled={!inStock || (hasVariants && !selectedVariant)}
            onClick={() => {
              if (!inStock) return;
              handleAddToCart();
              router.push("/checkout");
            }}
          >
            <Zap className="h-5 w-5 text-yellow-400" />
            Acheter maintenant
          </Button>

          <p className="text-xs text-gray-600 pt-1">
            ✓ Clé envoyée par email + espace client · ✓ Support 7j/7 · ✓ Paiement vérifié avant envoi
          </p>
        </div>
      </div>

      {upsells.length > 0 && <UpsellSection products={upsells} />}

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
