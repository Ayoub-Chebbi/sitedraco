"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Flame, Shield, Zap, Lock, Tag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

type TrendingProduct = {
  id: string; name: string; slug: string; platform: string;
  price: number; discountPrice: number | null; imageUrl: string | null;
  availableKeys: number;
};

function EmptyCart() {
  const [trending, setTrending] = useState<TrendingProduct[]>([]);

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((data) => setTrending((data.deals ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-900 border border-gray-800 mb-6">
          <ShoppingCart className="h-10 w-10 text-gray-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Découvrez notre catalogue de jeux numériques et cartes prépayées.</p>
        <Link href="/produits">
          <Button size="lg" className="gap-2 px-8">
            Explorer le catalogue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-900/30 border border-orange-800/40">
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tendances du moment</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {trending.map((p) => {
              const price = p.discountPrice ?? p.price;
              const hasDiscount = p.discountPrice !== null;
              const pct = hasDiscount ? Math.round((1 - p.discountPrice! / p.price) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  href={`/produits/${p.slug}`}
                  className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-purple-700/60 hover:shadow-lg hover:shadow-purple-900/20 transition-all duration-200"
                >
                  <div className="relative aspect-video bg-gray-800">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{pct}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white font-semibold truncate mb-1.5">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-purple-400">{formatPrice(price)}</span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-600 line-through">{formatPrice(p.price)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanierPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) return <EmptyCart />;

  const subtotal = total();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-800/40">
            <ShoppingCart className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mon panier</h1>
            <p className="text-sm text-gray-500">{itemCount} article{itemCount > 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Items list */}
          <div className="lg:col-span-3 space-y-3">
            {items.map((item) => {
              const price = item.discountPrice ?? item.price;
              const hasDiscount = item.discountPrice != null && item.discountPrice < item.price;
              const itemKey = `${item.productId}:${item.variantId ?? ""}:${item.variant ?? ""}`;
              return (
                <div
                  key={itemKey}
                  className="group flex gap-4 p-4 rounded-2xl border border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-800 shrink-0 border border-gray-700/50">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + platform */}
                    <div className="mb-1">
                      <h3 className="font-semibold text-white text-sm leading-snug truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 capitalize">{item.platform}</span>
                        {item.variant && (
                          <span className="text-xs bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-800/30">
                            {item.variant === "key" ? "🔑 Clé" : "👤 Compte"}
                          </span>
                        )}
                        {item.variantName && (
                          <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md">{item.variantName}</span>
                        )}
                      </div>
                    </div>

                    {/* Price + qty + delete */}
                    <div className="flex items-center justify-between mt-3">
                      {/* Qty control */}
                      <div className="flex items-center gap-1 bg-gray-800 rounded-xl border border-gray-700 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="w-7 h-7 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="w-7 h-7 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold text-white">{formatPrice(price * item.quantity)}</p>
                          {hasDiscount && item.quantity > 1 && (
                            <p className="text-xs text-gray-500">{formatPrice(price)} / unité</p>
                          )}
                        </div>
                        {/* Delete */}
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield, text: "Paiement sécurisé" },
                { icon: Zap, text: "Livraison 1h–24h" },
                { icon: Lock, text: "Données chiffrées" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-500">
                  <Icon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                <h2 className="font-semibold text-white text-sm">Récapitulatif</h2>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3 border-b border-gray-800 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}:${item.variantId ?? ""}:${item.variant ?? ""}`} className="flex items-start gap-3">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🎮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate leading-snug">{item.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-white shrink-0">
                      {formatPrice((item.discountPrice ?? item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 space-y-2.5 border-b border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sous-total</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Livraison</span>
                  <span className="text-green-400 font-medium">Gratuite</span>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-white">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button size="lg" className="w-full gap-2 text-base py-6 rounded-xl shadow-lg shadow-purple-900/30">
                    Commander maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <div className="flex items-center gap-2 justify-center">
                  <Tag className="h-3 w-3 text-gray-600" />
                  <p className="text-xs text-gray-600">Codes promo disponibles au checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
