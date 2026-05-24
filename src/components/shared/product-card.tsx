"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Eye, Star, ShoppingCart, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/types";

type ProductVariant = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  displayOrder: number;
};

type ExtProduct = Product & {
  availableKeys?: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  productType?: string | null;
  accountPrice?: number | null;
  accountDiscountPrice?: number | null;
  variants?: ProductVariant[];
};

type ProductCardProps = {
  product: ExtProduct;
  onAddToCart?: (product: Product, variant?: "key" | "account") => void;
  onQuickView?: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart, onQuickView }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const productType = (product.productType ?? "key") as "key" | "account" | "both";
  const hasBoth = productType === "both";
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = product.discountPrice ?? product.price;
  const inStock = product.availableKeys === undefined || product.availableKeys > 0;

  // popup: "closed" | "variant" | "select" | "added"
  const [popup, setPopup] = useState<"closed" | "variant" | "select" | "added">("closed");
  const [selectedVariant, setSelectedVariant] = useState<"key" | "account">("key");
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => product.variants?.[0]?.id ?? "");

  const selectedVariantObj = product.variants?.find((v) => v.id === selectedVariantId) ?? product.variants?.[0];

  const variantPrice = selectedVariant === "key"
    ? (product.discountPrice ?? product.price)
    : (product.accountDiscountPrice ?? product.accountPrice ?? product.price);

  const variantOriginalPrice = selectedVariant === "key"
    ? product.price
    : (product.accountPrice ?? product.price);

  const variantHasDiscount = selectedVariant === "key"
    ? hasDiscount
    : product.accountDiscountPrice && product.accountPrice && product.accountDiscountPrice < product.accountPrice;

  function handleBuyNow() {
    if (hasVariants) {
      setPopup("variant");
    } else if (hasBoth) {
      setPopup("select");
    } else {
      onAddToCart?.(product);
      setPopup("added");
    }
  }

  function handleConfirmVariant() {
    onAddToCart?.(product, selectedVariant);
    setPopup("added");
  }

  function handleConfirmCustomVariant() {
    if (!selectedVariantObj) return;
    addItem({
      productId: product.id,
      variantId: selectedVariantObj.id,
      variantName: selectedVariantObj.name,
      name: `${product.name} — ${selectedVariantObj.name}`,
      price: selectedVariantObj.price,
      discountPrice: selectedVariantObj.discountPrice,
      imageUrl: product.imageUrl,
      platform: product.platform,
      quantity: 1,
    });
    setPopup("added");
  }

  function closePopup() {
    setPopup("closed");
    setSelectedVariant("key");
  }

  return (
    <>
      <div className="group relative flex flex-col rounded-xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-purple-700/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/20">
        {hasDiscount && !hasVariants && (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
            -{Math.round(((product.price - displayPrice) / product.price) * 100)}%
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 z-10 bg-gray-900/80 flex items-center justify-center rounded-xl">
            <span className="text-gray-400 font-semibold text-sm">Rupture de stock</span>
          </div>
        )}

        {/* Image + Quick View overlay */}
        <div className="relative aspect-4/3 bg-gray-800 overflow-hidden">
          <Link href={`/produits/${product.slug}`}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-linear-to-br from-gray-800 to-gray-900">
                🎮
              </div>
            )}
          </Link>

          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]"
              aria-label="Aperçu rapide"
            >
              <span className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
                <Eye className="h-4 w-4" />
                Aperçu rapide
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4 gap-2">
          <div className="flex items-center justify-between gap-2">
            <PlatformBadge platform={product.platform} />
            {inStock && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                En stock
              </span>
            )}
          </div>

          <Link href={`/produits/${product.slug}`}>
            <h3 className="font-semibold text-gray-100 text-sm leading-tight hover:text-purple-300 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Variant chips */}
          {hasVariants && product.variants && (
            <div className="flex flex-wrap gap-1">
              {product.variants.slice(0, 3).map((v) => (
                <span key={v.id} className="text-xs bg-purple-900/30 border border-purple-700/40 text-purple-300 px-1.5 py-0.5 rounded font-medium">
                  {v.name}
                </span>
              ))}
              {product.variants.length > 3 && (
                <span className="text-xs text-gray-600">+{product.variants.length - 3}</span>
              )}
            </div>
          )}

          {!hasVariants && hasBoth && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-purple-900/40 border border-purple-700/50 text-purple-300 px-2 py-0.5 rounded-full font-medium">
                🔑 Clé
              </span>
              <span className="text-xs text-gray-600">+</span>
              <span className="text-xs bg-blue-900/40 border border-blue-700/50 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                👤 Compte
              </span>
            </div>
          )}

          {(product.rating ?? 0) > 0 && (product.reviewCount ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-gray-300">{product.rating?.toFixed(1)}</span>
              <span className="text-xs text-gray-600">({product.reviewCount})</span>
              {(product.soldCount ?? 0) > 100 && (
                <span className="text-xs text-gray-600 ml-1">
                  · {product.soldCount! > 1000 ? `${(product.soldCount! / 1000).toFixed(1)}k` : product.soldCount} ventes
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-auto pt-1">
            <span className="text-lg font-bold text-white">
              {hasVariants
                ? `À partir de ${formatPrice(Math.min(...(product.variants?.map((v) => v.discountPrice ?? v.price) ?? [product.price])))}`
                : formatPrice(displayPrice)
              }
            </span>
            {!hasVariants && hasDiscount && (
              <span className="text-sm text-gray-500 line-through">{formatPrice(product.price)}</span>
            )}
            {!hasVariants && hasBoth && product.accountPrice && (
              <span className="text-xs text-gray-600 ml-auto">
                Compte: {formatPrice(product.accountDiscountPrice ?? product.accountPrice)}
              </span>
            )}
          </div>

          {onAddToCart && (
            <Button
              size="sm"
              className="w-full gap-2 mt-1"
              disabled={!inStock}
              onClick={handleBuyNow}
            >
              <Zap className="h-4 w-4" />
              Acheter maintenant
            </Button>
          )}
        </div>
      </div>

      {/* Popup */}
      {popup !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Custom variant selection (gift cards etc.) */}
            {popup === "variant" && product.variants && (
              <>
                <div className="mb-5">
                  <p className="text-white font-semibold text-sm mb-0.5">Choisissez un montant</p>
                  <p className="text-gray-400 text-xs truncate">{product.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-5">
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
                        <p className="text-sm font-bold text-purple-300">{formatPrice(display)}</p>
                        {v.discountPrice && v.discountPrice < v.price && (
                          <p className="text-xs text-gray-500 line-through">{formatPrice(v.price)}</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!selectedVariantObj}
                  onClick={handleConfirmCustomVariant}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter au panier
                </Button>
              </>
            )}

            {/* Key / account selection */}
            {popup === "select" && (
              <>
                <div className="mb-5">
                  <p className="text-white font-semibold text-sm mb-0.5">Choisissez votre type</p>
                  <p className="text-gray-400 text-xs truncate">{product.name}</p>
                </div>

                <div className="flex flex-col gap-2 mb-5">
                  {([
                    { value: "key" as const, emoji: "🔑", label: "Clé / Code", desc: "Clé d'activation numérique", price: product.price, discountPrice: product.discountPrice },
                    { value: "account" as const, emoji: "👤", label: "Compte", desc: "Accès à un compte existant", price: product.accountPrice ?? 0, discountPrice: product.accountDiscountPrice },
                  ]).map(({ value, emoji, label, desc, price, discountPrice }) => {
                    const display = discountPrice ?? price;
                    const discounted = discountPrice && discountPrice < price;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedVariant(value)}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                          selectedVariant === value
                            ? "border-purple-500 bg-purple-900/30"
                            : "border-gray-700 bg-gray-800 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{emoji}</span>
                          <div>
                            <p className={`text-sm font-semibold ${selectedVariant === value ? "text-white" : "text-gray-300"}`}>{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold text-white">{formatPrice(display)}</p>
                          {discounted && <p className="text-xs text-gray-500 line-through">{formatPrice(price)}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button className="w-full gap-2" onClick={handleConfirmVariant}>
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter au panier
                </Button>
              </>
            )}

            {/* Added confirmation */}
            {popup === "added" && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Ajouté au panier !</p>
                    <p className="text-gray-400 text-xs truncate max-w-50">{product.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3 mb-5">
                  {hasVariants && selectedVariantObj && (
                    <span className="text-gray-400 text-sm">{selectedVariantObj.name}</span>
                  )}
                  {!hasVariants && hasBoth && (
                    <span className="text-gray-400 text-sm">
                      {selectedVariant === "key" ? "🔑 Clé / Code" : "👤 Compte"}
                    </span>
                  )}
                  {!hasVariants && !hasBoth && <span className="text-gray-400 text-sm">Prix</span>}
                  <div className="flex items-center gap-2 ml-auto">
                    {hasVariants && selectedVariantObj ? (
                      <>
                        {selectedVariantObj.discountPrice && selectedVariantObj.discountPrice < selectedVariantObj.price && (
                          <span className="text-gray-600 text-sm line-through">{formatPrice(selectedVariantObj.price)}</span>
                        )}
                        <span className="text-white font-bold">{formatPrice(selectedVariantObj.discountPrice ?? selectedVariantObj.price)}</span>
                      </>
                    ) : (
                      <>
                        {variantHasDiscount && (
                          <span className="text-gray-600 text-sm line-through">{formatPrice(variantOriginalPrice)}</span>
                        )}
                        <span className="text-white font-bold">{formatPrice(variantPrice)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href="/panier" onClick={closePopup}>
                    <Button className="w-full gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Aller au panier
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={closePopup}>
                    Continuer mes achats
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
