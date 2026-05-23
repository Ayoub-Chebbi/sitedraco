"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Plus, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/lib/use-toast";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
};

type UpsellEntry = {
  id: string;
  displayOrder: number;
  upsellProduct: ProductOption;
};

type Props = {
  productId: string;
  productName: string;
  initialUpsells: UpsellEntry[];
  allProducts: ProductOption[];
};

export function UpsellEditorClient({ productId, productName, initialUpsells, allProducts }: Props) {
  const [upsells, setUpsells] = useState<UpsellEntry[]>(initialUpsells);
  const [selectedId, setSelectedId] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const existingIds = new Set(upsells.map((u) => u.upsellProduct.id));
  const available = allProducts.filter((p) => !existingIds.has(p.id));

  async function handleAdd() {
    if (!selectedId) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/upsells`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upsellProductId: selectedId, displayOrder: upsells.length }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Erreur", description: err.error || "Impossible d'ajouter", variant: "error" });
        return;
      }
      const product = allProducts.find((p) => p.id === selectedId)!;
      const newEntry = await res.json();
      setUpsells((prev) => [...prev, { ...newEntry, upsellProduct: product }]);
      setSelectedId("");
      toast({ title: "Upsell ajouté", description: product.name, variant: "success" });
    });
  }

  async function handleRemove(upsellProductId: string, name: string) {
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/products/${productId}/upsells?upsellProductId=${upsellProductId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast({ title: "Erreur", description: "Impossible de supprimer", variant: "error" });
        return;
      }
      setUpsells((prev) => prev.filter((u) => u.upsellProduct.id !== upsellProductId));
      toast({ title: "Upsell retiré", description: name, variant: "success" });
    });
  }

  return (
    <div className="space-y-6">
      {/* Current upsells */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">
            Upsells actuels de « {productName} »
          </h2>
          <span className="ml-auto text-xs text-gray-500">{upsells.length} produit{upsells.length !== 1 ? "s" : ""}</span>
        </div>

        {upsells.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun upsell configuré.</p>
            <p className="text-xs mt-1">Ajoutez des produits complémentaires ci-dessous.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800/50">
            {upsells.map((u, i) => {
              const p = u.upsellProduct;
              const price = p.discountPrice ?? p.price;
              return (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors">
                  <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <PlatformBadge platform={p.platform} />
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">{formatPrice(price)}</span>
                  <button
                    onClick={() => handleRemove(p.id, p.name)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add upsell */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Ajouter un upsell</h3>
        {available.length === 0 ? (
          <p className="text-sm text-gray-500">Tous les produits sont déjà ajoutés.</p>
        ) : (
          <div className="flex gap-2">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 text-sm bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">Sélectionner un produit…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.discountPrice ?? p.price)}
                </option>
              ))}
            </select>
            <Button onClick={handleAdd} disabled={!selectedId || isPending} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
