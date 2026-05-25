"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { PLATFORMS } from "@/lib/utils";

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

export type ProductFormValues = {
  name: string;
  price: string;
  discountPrice: string;
  accountPrice: string;
  accountDiscountPrice: string;
  slug: string;
  description: string;
  accountDescription: string;
  platform: string;
  category: string;
  brand: string;
  productType: "key" | "account" | "both";
  imageUrl: string;
  isActive: boolean;
  lowStockAlert: string;
  soldCount: string;
  rating: string;
  reviewCount: string;
  urgencyHours: string;
};

const DEFAULTS: ProductFormValues = {
  name: "",
  price: "",
  discountPrice: "",
  accountPrice: "",
  accountDiscountPrice: "",
  slug: "",
  description: "",
  accountDescription: "",
  platform: "steam",
  category: "game",
  brand: "",
  productType: "key",
  imageUrl: "",
  isActive: true,
  lowStockAlert: "5",
  soldCount: "0",
  rating: "4.8",
  reviewCount: "0",
  urgencyHours: "4",
};

type Props = {
  initial?: Partial<ProductFormValues>;
  mode: "create" | "edit";
  productId?: string;
};

export function ProductForm({ initial, mode, productId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<ProductFormValues>({ ...DEFAULTS, ...initial });
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [categories, setCategories] = useState<{ id: string; slug: string; label: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function set(key: keyof ProductFormValues, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugEdited) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Erreur serveur (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      if (!data.url) throw new Error("URL manquante dans la réponse");
      set("imageUrl", data.url);
      toast({ title: "Image uploadée", variant: "success" });
    } catch (err) {
      toast({ title: "Erreur upload", description: (err as Error).message, variant: "error" });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const hasKey = form.productType === "key" || form.productType === "both";
      const hasAccount = form.productType === "account" || form.productType === "both";

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        accountDescription: (hasAccount && form.accountDescription.trim()) ? form.accountDescription.trim() : null,
        platform: form.platform,
        category: form.category,
        brand: form.brand.trim() || null,
        productType: form.productType,
        price: parseFloat(form.price),
        discountPrice: hasKey && form.discountPrice ? parseFloat(form.discountPrice) : null,
        accountPrice: hasAccount && form.accountPrice ? parseFloat(form.accountPrice) : null,
        accountDiscountPrice: hasAccount && form.accountDiscountPrice ? parseFloat(form.accountDiscountPrice) : null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
        lowStockAlert: parseInt(form.lowStockAlert) || 5,
        soldCount: parseInt(form.soldCount) || 0,
        rating: parseFloat(form.rating) || 4.8,
        reviewCount: parseInt(form.reviewCount) || 0,
        urgencyHours: parseInt(form.urgencyHours) || 4,
      };

      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Erreur de validation";
        toast({ title: "Erreur", description: msg, variant: "error" });
        return;
      }

      toast({
        title: mode === "create" ? "Produit créé !" : "Modifications enregistrées",
        description: data.name,
        variant: "success",
      });
      router.push("/admin/produits");
      router.refresh();
    });
  }

  const hasKey = form.productType === "key" || form.productType === "both";
  const hasAccount = form.productType === "account" || form.productType === "both";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Main info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Informations principales</h2>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Nom *</label>
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
          <p className="text-xs text-gray-600 mt-1">Lettres minuscules, chiffres, tirets</p>
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
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {form.category === "giftcard" && (
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Marque / Jeu</label>
            <input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="ex: Valorant, PlayStation, Xbox, Netflix…"
            />
            <p className="text-xs text-gray-600 mt-1">Utilisé pour filtrer les cartes cadeaux par marque</p>
          </div>
        )}
      </div>

      {/* Image upload */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Image du produit</h2>

        {form.imageUrl && (
          <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
            <Image src={form.imageUrl} alt="Aperçu" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => set("imageUrl", "")}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Upload…" : "Choisir un fichier"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Ou coller une URL d&apos;image</label>
          <input
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="https://…"
          />
        </div>
      </div>

      {/* Product type */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type de produit</h2>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "key", label: "Clé / Code", desc: "Clé d'activation numérique" },
            { value: "account", label: "Compte", desc: "Accès à un compte existant" },
            { value: "both", label: "Les deux", desc: "Clé ET compte disponibles" },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("productType", value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                form.productType === value
                  ? "border-purple-500 bg-purple-900/30 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs mt-0.5 opacity-70">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Descriptions */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description(s)</h2>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">
            {form.productType === "both" ? "Description — Clé / Code" : "Description"}
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Décrivez ce produit pour le client…"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {hasAccount && (
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              {form.productType === "both" ? "Description — Compte" : "Description du compte"}
            </label>
            <textarea
              rows={3}
              value={form.accountDescription}
              onChange={(e) => set("accountDescription", e.target.value)}
              placeholder={form.productType === "both" ? "Description spécifique à la version compte…" : "Décrivez ce compte pour le client…"}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            {form.productType === "both" && (
              <p className="text-xs text-gray-600 mt-1">Si vide, la description de la clé sera affichée par défaut.</p>
            )}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarification</h2>

        {hasKey && (
          <div>
            {form.productType === "both" && (
              <p className="text-xs font-medium text-purple-400 mb-2 uppercase tracking-wider">Clé / Code</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Prix {form.productType === "both" ? "clé" : ""} (TND) *
                </label>
                <input
                  required
                  type="number" min="0" step="0.001"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="49.900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Prix promo clé (TND)</label>
                <input
                  type="number" min="0" step="0.001"
                  value={form.discountPrice}
                  onChange={(e) => set("discountPrice", e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="39.900"
                />
              </div>
            </div>
          </div>
        )}

        {hasAccount && (
          <div>
            {form.productType === "both" && (
              <p className="text-xs font-medium text-blue-400 mb-2 uppercase tracking-wider">Compte</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Prix {form.productType === "both" ? "compte" : ""} (TND) *
                </label>
                <input
                  required={form.productType === "account"}
                  type="number" min="0" step="0.001"
                  value={form.productType === "account" ? form.price : form.accountPrice}
                  onChange={(e) =>
                    set(form.productType === "account" ? "price" : "accountPrice", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="49.900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Prix promo compte (TND)</label>
                <input
                  type="number" min="0" step="0.001"
                  value={form.productType === "account" ? form.discountPrice : form.accountDiscountPrice}
                  onChange={(e) =>
                    set(form.productType === "account" ? "discountPrice" : "accountDiscountPrice", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="39.900"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Social proof & settings */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Social proof & Paramètres</h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["soldCount", "Ventes affichées", "0"],
            ["rating", "Note (0–5)", "4.8"],
            ["reviewCount", "Nombre d'avis", "0"],
            ["lowStockAlert", "Alerte stock bas", "5"],
            ["urgencyHours", "Minuteur urgence (h)", "4"],
          ] as [keyof ProductFormValues, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-sm text-gray-300 mb-1.5">{label}</label>
              <input
                type="number"
                min="0"
                step={key === "rating" ? "0.1" : "1"}
                max={key === "rating" ? "5" : undefined}
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          ))}
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
        <Button type="submit" disabled={isPending || isUploading} className="flex-1">
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />{mode === "create" ? "Création…" : "Enregistrement…"}</>
          ) : (
            mode === "create" ? "Créer le produit" : "Enregistrer les modifications"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
