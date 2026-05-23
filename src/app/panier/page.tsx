"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

export default function PanierPage() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-700 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8">Parcourez notre catalogue pour trouver vos prochains jeux.</p>
        <Link href="/produits">
          <Button size="lg" className="gap-2">
            Parcourir le catalogue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">
        Mon panier <span className="text-gray-500 text-lg font-normal">({items.length} article{items.length > 1 ? "s" : ""})</span>
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => {
            const price = item.discountPrice ?? item.price;
            return (
              <div key={item.productId} className="flex gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.platform}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 border border-gray-700 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{formatPrice(price * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="sticky top-20 self-start">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h2 className="font-semibold text-white">Récapitulatif</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-400 truncate max-w-[160px]">{item.name} x{item.quantity}</span>
                  <span className="text-gray-300 shrink-0">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-3 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-white text-lg">{formatPrice(total())}</span>
            </div>
            <Link href="/checkout">
              <Button size="lg" className="w-full gap-2 mt-2">
                Passer la commande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-gray-600 text-center">Paiement sécurisé · Livraison rapide</p>
          </div>
        </div>
      </div>
    </div>
  );
}
