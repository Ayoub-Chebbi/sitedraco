"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

type ExtProduct = Product & {
  availableKeys?: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  productType?: string | null;
  accountPrice?: number | null;
  accountDiscountPrice?: number | null;
};

type Props = {
  product: ExtProduct | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: "key" | "account") => void;
};

export function QuickViewModal({ product, onClose, onAddToCart }: Props) {
  const productType = (product?.productType ?? "key") as "key" | "account" | "both";
  const hasBoth = productType === "both";

  const [variant, setVariant] = useState<"key" | "account">("key");

  // Reset variant when product changes
  useEffect(() => {
    setVariant(product?.productType === "account" ? "account" : "key");
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const inStock = product.availableKeys === undefined || product.availableKeys > 0;

  const variantPrice =
    variant === "key"
      ? (product.discountPrice ?? product.price)
      : (product.accountDiscountPrice ?? product.accountPrice ?? product.price);

  const variantOriginal =
    variant === "key"
      ? product.price
      : (product.accountPrice ?? product.price);

  const hasDiscount = variantPrice < variantOriginal;

  // For the discount badge on the image, use key price (always shown)
  const keyDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square sm:aspect-auto bg-gray-800">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full min-h-[220px] flex items-center justify-center text-6xl">🎮</div>
            )}
            {keyDiscount && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                -{Math.round(((product.price - (product.discountPrice ?? product.price)) / product.price) * 100)}%
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <PlatformBadge platform={product.platform} />
              <span className={`text-xs flex items-center gap-1 ${inStock ? "text-green-400" : "text-red-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-green-400" : "bg-red-400"}`} />
                {inStock ? "En stock" : "Rupture"}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white leading-tight">{product.name}</h2>

            {/* Rating */}
            {(product.rating ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-white">{product.rating?.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({product.reviewCount} avis)</span>
                {(product.soldCount ?? 0) > 0 && (
                  <span className="text-xs text-gray-500 ml-2">{product.soldCount?.toLocaleString("fr-FR")} vendus</span>
                )}
              </div>
            )}

            {product.description && (
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{product.description}</p>
            )}

            {/* Variant selector — only for "both" products */}
            {hasBoth && (
              <div className="flex gap-2">
                {([
                  {
                    value: "key" as const,
                    emoji: "🔑",
                    label: "Clé / Code",
                    price: product.price,
                    discountPrice: product.discountPrice,
                  },
                  {
                    value: "account" as const,
                    emoji: "👤",
                    label: "Compte",
                    price: product.accountPrice ?? 0,
                    discountPrice: product.accountDiscountPrice,
                  },
                ]).map(({ value, emoji, label, price, discountPrice }) => {
                  const display = discountPrice ?? price;
                  const isSelected = variant === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVariant(value)}
                      className={`flex-1 flex flex-col gap-0.5 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-900/30"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                      <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-300"}`}>
                        {label}
                      </span>
                      <span className="text-sm font-bold text-purple-300">{formatPrice(display)}</span>
                      {discountPrice && discountPrice < price && (
                        <span className="text-[10px] text-gray-500 line-through">{formatPrice(price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">{formatPrice(variantPrice)}</span>
              {hasDiscount && <span className="text-gray-500 line-through">{formatPrice(variantOriginal)}</span>}
              {hasDiscount && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                  -{Math.round(((variantOriginal - variantPrice) / variantOriginal) * 100)}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full gap-2"
                disabled={!inStock}
                onClick={() => {
                  onAddToCart(product, hasBoth ? variant : undefined);
                  onClose();
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier
              </Button>
              <Link href={`/produits/${product.slug}`} onClick={onClose}>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  Voir la page complète <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> Livraison 15–60 min</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500" /> Clé envoyée par email + espace client</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
