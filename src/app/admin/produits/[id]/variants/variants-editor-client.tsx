"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { formatPrice } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  displayOrder: number;
  isActive: boolean;
};

type Props = {
  productId: string;
  initialVariants: Variant[];
};

const EMPTY_FORM = { name: "", price: "", discountPrice: "", displayOrder: "0" };

export function VariantsEditorClient({ productId, initialVariants }: Props) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        displayOrder: parseInt(form.displayOrder) || variants.length,
      };

      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: "Impossible d'ajouter la variante.", variant: "error" });
        return;
      }
      setVariants((prev) => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast({ title: "Variante ajoutée", variant: "success" });
    });
  }

  function startEdit(v: Variant) {
    setEditingId(v.id);
    setEditForm({
      name: v.name,
      price: v.price.toString(),
      discountPrice: v.discountPrice?.toString() ?? "",
      displayOrder: v.displayOrder.toString(),
    });
  }

  function handleEdit(e: React.FormEvent, variantId: string) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        discountPrice: editForm.discountPrice ? parseFloat(editForm.discountPrice) : null,
        displayOrder: parseInt(editForm.displayOrder) || 0,
      };

      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: "Impossible de modifier la variante.", variant: "error" });
        return;
      }
      setVariants((prev) => prev.map((v) => v.id === variantId ? data : v));
      setEditingId(null);
      toast({ title: "Variante mise à jour", variant: "success" });
    });
  }

  async function handleDelete(variantId: string) {
    setDeletingId(variantId);
    const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (!res.ok) {
      toast({ title: "Erreur", description: "Impossible de supprimer la variante.", variant: "error" });
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
    toast({ title: "Variante supprimée", variant: "success" });
  }

  async function toggleActive(v: Variant) {
    const res = await fetch(`/api/admin/products/${productId}/variants/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    const data = await res.json();
    if (res.ok) {
      setVariants((prev) => prev.map((item) => item.id === v.id ? data : item));
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 bg-gray-900 border border-gray-800 rounded-xl p-4">
        Les variantes permettent de proposer plusieurs montants ou versions d&apos;un même produit (ex: carte cadeau 10 TND, 25 TND, 50 TND). Le client choisit une variante avant d&apos;ajouter au panier.
      </div>

      {/* Variant list */}
      {variants.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {variants.map((v) => (
            <div key={v.id}>
              {editingId === v.id ? (
                <form onSubmit={(e) => handleEdit(e, v.id)} className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nom *</label>
                      <input
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="ex: 25 TND"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ordre d&apos;affichage</label>
                      <input
                        type="number" min="0"
                        value={editForm.displayOrder}
                        onChange={(e) => setEditForm((f) => ({ ...f, displayOrder: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prix (TND) *</label>
                      <input
                        required type="number" min="0" step="0.001"
                        value={editForm.price}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prix promo (TND)</label>
                      <input
                        type="number" min="0" step="0.001"
                        value={editForm.discountPrice}
                        onChange={(e) => setEditForm((f) => ({ ...f, discountPrice: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending} className="gap-1">
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Enregistrer
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${v.isActive ? "text-white" : "text-gray-500"}`}>
                        {v.name}
                      </span>
                      {!v.isActive && (
                        <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">inactif</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-purple-400 font-medium">
                        {formatPrice(v.discountPrice ?? v.price)}
                      </span>
                      {v.discountPrice && v.discountPrice < v.price && (
                        <span className="text-xs text-gray-600 line-through">{formatPrice(v.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(v)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        v.isActive
                          ? "border-green-800 text-green-400 hover:bg-green-900/30"
                          : "border-gray-700 text-gray-500 hover:border-gray-600"
                      }`}
                    >
                      {v.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(v)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    >
                      {deletingId === v.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {variants.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center text-gray-500">
          Aucune variante. Ajoutez-en une pour permettre au client de choisir un montant.
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="rounded-xl border border-purple-800/50 bg-gray-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Nouvelle variante</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="ex: 25 TND"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ordre d&apos;affichage</label>
              <input
                type="number" min="0"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix (TND) *</label>
              <input
                required type="number" min="0" step="0.001"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="25.000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix promo (TND)</label>
              <input
                type="number" min="0" step="0.001"
                value={form.discountPrice}
                onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1">
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Ajouter
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, displayOrder: variants.length.toString() }); }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une variante
        </Button>
      )}
    </div>
  );
}
