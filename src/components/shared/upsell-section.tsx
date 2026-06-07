"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, ShoppingCart, Clock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/lib/use-toast";
import type { Product } from "@/types";

type UpsellProduct = Pick<Product, "id" | "name" | "slug" | "price" | "discountPrice" | "imageUrl" | "platform" | "category"> & {
  availableKeys?: number;
};

type Props = {
  products: UpsellProduct[];
  title?: string;
  variant?: "page" | "checkout";
};

function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s <= 1 ? initialSeconds : s - 1)), 1000);
    return () => clearInterval(t);
  }, [initialSeconds]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function UpsellCard({ p, onAdd, variant }: { p: UpsellProduct; onAdd: (p: UpsellProduct) => void; variant: "page" | "checkout" }) {
  const price = p.discountPrice ?? p.price;
  const hasDiscount = p.discountPrice && p.discountPrice < p.price;
  const savings = hasDiscount ? p.price - p.discountPrice! : 0;
  const savingsPct = hasDiscount ? Math.round((savings / p.price) * 100) : 0;
  const lowStock = p.availableKeys !== undefined && p.availableKeys <= 5;

  if (variant === "checkout") {
    return (
      <div className="relative flex items-center gap-3 p-3 rounded-xl border border-purple-700/30 bg-purple-950/20 hover:border-purple-500/60 hover:bg-purple-950/30 transition-all group">
        {hasDiscount && (
          <div className="absolute -top-2 -right-2 bg-linear-to-r from-red-500 to-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
            -{savingsPct}%
          </div>
        )}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0 border border-gray-700">
          {p.imageUrl ? (
            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/produits/${p.slug}`}>
            <p className="text-xs font-semibold text-gray-200 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">{p.name}</p>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-black text-white">{formatPrice(price)}</span>
            {hasDiscount && <span className="text-[10px] text-gray-500 line-through">{formatPrice(p.price)}</span>}
          </div>
          {lowStock && (
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">⚠ Seulement {p.availableKeys} restant{p.availableKeys! > 1 ? "s" : ""}</p>
          )}
        </div>
        <button
          onClick={() => onAdd(p)}
          className="shrink-0 flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <ShoppingCart className="h-3 w-3" />
          Ajouter
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col rounded-2xl border border-gray-800 bg-gray-900 hover:border-purple-600/50 transition-all duration-200 overflow-hidden group hover:shadow-lg hover:shadow-purple-900/20">
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
          -{savingsPct}% · Économisez {formatPrice(savings)}
        </div>
      )}
      {lowStock && !hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-black text-xs font-black px-2.5 py-1 rounded-full">
          🔥 Stock limité
        </div>
      )}
      {lowStock && hasDiscount && (
        <div className="absolute top-9 left-3 z-10 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          {p.availableKeys} restant{p.availableKeys! > 1 ? "s" : ""}
        </div>
      )}

      <div className="relative aspect-video overflow-hidden bg-gray-800">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎮</div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 to-transparent" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <PlatformBadge platform={p.platform} />
        <Link href={`/produits/${p.slug}`}>
          <p className="text-sm font-semibold text-gray-100 mt-1.5 mb-3 leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">{p.name}</p>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-black text-white">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through ml-1.5">{formatPrice(p.price)}</span>
            )}
          </div>
          <Button
            size="sm"
            className="gap-1.5 shrink-0 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-900/30"
            onClick={() => onAdd(p)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UpsellSection({ products, title, variant = "page" }: Props) {
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();
  const countdown = useCountdown(600 + Math.floor(Math.random() * 300));

  if (products.length === 0) return null;

  function handleAdd(p: UpsellProduct) {
    addItem({
      productId: p.id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice ?? undefined,
      imageUrl: p.imageUrl,
      platform: p.platform,
      quantity: 1,
    });
    toast({ title: "Ajouté au panier !", description: p.name, variant: "success" });
  }

  if (variant === "checkout") {
    return (
      <div className="rounded-2xl border border-purple-700/30 bg-gray-900/60 overflow-hidden mt-3">
        <div className="px-4 py-3 border-b border-purple-800/30 bg-purple-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold text-white">Souvent achetés ensemble</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-orange-300 font-semibold bg-orange-950/40 border border-orange-800/40 rounded-full px-2.5 py-1">
            <Clock className="h-3 w-3" />
            {countdown}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {products.map((p) => (
            <UpsellCard key={p.id} p={p} onAdd={handleAdd} variant="checkout" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-800">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title ?? "Complétez votre commande"}</h2>
            <p className="text-xs text-gray-500">Achetés ensemble par d'autres joueurs</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-orange-300 font-semibold bg-orange-950/40 border border-orange-800/40 rounded-full px-3 py-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Offre expire dans {countdown}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <UpsellCard key={p.id} p={p} onAdd={handleAdd} variant="page" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
        <span>Recommandés par d'autres clients ayant acheté ce produit</span>
      </div>
    </div>
  );
}
