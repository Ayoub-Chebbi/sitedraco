"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { PLATFORMS, CATEGORIES } from "@/lib/utils";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Field = {
  name: string;
  price: string;
  discountPrice: string;
  slug: string;
  description: string;
  platform: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
  lowStockAlert: string;
  soldCount: string;
  rating: string;
  reviewCount: string;
  urgencyHours: string;
};

const INITIAL: Field = {
  name: "",
  price: "",
  discountPrice: "",
  slug: "",
  description: "",
  platform: "steam",
  category: "game",
  imageUrl: "",
  isActive: true,
  lowStockAlert: "5",
  soldCount: "0",
  rating: "4.8",
  reviewCount: "0",
  urgencyHours: "4",
};

export function CreateProductForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Field>(INITIAL);
  const [slugEdited, setSlugEdited] = useState(false);

  function set(key: keyof Field, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugEdited) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        platform: form.platform,
        category: form.category,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
        lowStockAlert: parseInt(form.lowStockAlert) || 5,
        soldCount: parseInt(form.soldCount) || 0,
        rating: parseFloat(form.rating) || 4.8,
        reviewCount: parseInt(form.reviewCount) || 0,
        urgencyHours: parseInt(form.urgencyHours) || 4,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Erreur de validation";
        toast({ title: "Erreur", description: msg, variant: "error" });
        return;
      }

      toast({ title: "Produit créé !", description: data.name, variant: "success" });
      router.push("/admin/produits");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Informations principales</h2>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Nom du produit *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="ex: God of War Ragnarök PS5"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Slug (URL) *</label>
          <input
            required
            value={form.slug}
            onChange={(e) => { setSlugEdited(true); set("slug", e.target.value); }}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="god-of-war-ragnarok-ps5"
          />
          <p className="text-xs text-gray-600 mt-1">Lettres minuscules, chiffres et tirets uniquement</p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Description du produit…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Plateforme *</label>
            <select
              required
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Catégorie *</label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">URL de l&apos;image</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tarification</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Prix (TND) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.001"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="49.900"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Prix promo (TND)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              placeholder="39.900"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Social proof & Stock</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Ventes affichées</label>
            <input type="number" min="0" value={form.soldCount} onChange={(e) => set("soldCount", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Note (0–5)</label>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nombre d&apos;avis</label>
            <input type="number" min="0" value={form.reviewCount} onChange={(e) => set("reviewCount", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Alerte stock bas</label>
            <input type="number" min="0" value={form.lowStockAlert} onChange={(e) => set("lowStockAlert", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Minuteur urgence (h)</label>
            <input type="number" min="0" value={form.urgencyHours} onChange={(e) => set("urgencyHours", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Actif (visible en boutique)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Création en cours…" : "Créer le produit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
