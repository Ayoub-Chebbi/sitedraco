"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { Sparkles, Edit2, Archive, Layers, Search, X, ChevronDown, Copy, Loader2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  platform: string;
  category: string;
  price: number;
  discountPrice: number | null;
  isActive: boolean;
  lowStockAlert: number;
  totalStock: number;
  _count: { upsells: number };
};

const STOCK_FILTERS = [
  { value: "all",      label: "Tout le stock" },
  { value: "in",       label: "En stock" },
  { value: "low",      label: "Stock faible" },
  { value: "out",      label: "Rupture" },
];

const STATUS_FILTERS = [
  { value: "all",      label: "Tous" },
  { value: "active",   label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
];

export function ProductsClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [platform, setPlatform]     = useState("all");
  const [category, setCategory]     = useState("all");
  const [stock, setStock]           = useState("all");
  const [status, setStatus]         = useState("all");
  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function handleDuplicate(productId: string) {
    setDuplicating(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.push(`/admin/produits/${data.id}/edit`);
      router.refresh();
    } catch (e: any) {
      alert(e.message ?? "Erreur lors de la duplication.");
    } finally {
      setDuplicating(null);
    }
  }

  const platforms = useMemo(() => {
    const vals = [...new Set(products.map((p) => p.platform))].sort();
    return [{ value: "all", label: "Toutes les plateformes" }, ...vals.map((v) => ({ value: v, label: v }))];
  }, [products]);

  const categories = useMemo(() => {
    const vals = [...new Set(products.map((p) => p.category))].sort();
    return [{ value: "all", label: "Toutes les catégories" }, ...vals.map((v) => ({ value: v, label: v }))];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (platform !== "all" && p.platform !== platform) return false;
      if (category !== "all" && p.category !== category) return false;
      if (status === "active" && !p.isActive) return false;
      if (status === "inactive" && p.isActive) return false;
      if (stock === "in" && !(p.totalStock > p.lowStockAlert)) return false;
      if (stock === "low" && !(p.totalStock > 0 && p.totalStock <= p.lowStockAlert)) return false;
      if (stock === "out" && p.totalStock !== 0) return false;
      return true;
    });
  }, [products, search, platform, category, stock, status]);

  const hasFilters = search || platform !== "all" || category !== "all" || stock !== "all" || status !== "all";

  function reset() {
    setSearch(""); setPlatform("all"); setCategory("all"); setStock("all"); setStatus("all");
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={platform} onChange={setPlatform} options={platforms} />
          <Select value={category} onChange={setCategory} options={categories} />
          <Select value={stock}    onChange={setStock}    options={STOCK_FILTERS} />
          <Select value={status}   onChange={setStatus}   options={STATUS_FILTERS} />

          {hasFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {filtered.length === products.length
              ? `${products.length} produit${products.length !== 1 ? "s" : ""}`
              : `${filtered.length} / ${products.length} produits`}
          </p>
          {hasFilters && filtered.length === 0 && (
            <span className="text-xs text-yellow-500">Aucun résultat pour ces filtres</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-175">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Produit</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Prix</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Stock</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Upsells</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium" colSpan={4}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                  Aucun produit ne correspond aux filtres sélectionnés.
                </td>
              </tr>
            ) : (
              filtered.map((product, i) => (
                <tr
                  key={product.id}
                  className={`border-b border-gray-800/50 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30"} hover:bg-gray-900/60 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{product.name}</p>
                          {!product.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">Inactif</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PlatformBadge platform={product.platform} />
                          <span className="text-xs text-gray-600">{product.category}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {product.discountPrice ? (
                      <span>
                        <span className="text-white font-semibold">{formatPrice(product.discountPrice)}</span>
                        <span className="text-gray-600 line-through ml-1">{formatPrice(product.price)}</span>
                      </span>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.totalStock > product.lowStockAlert
                        ? "bg-green-900/40 text-green-400"
                        : product.totalStock > 0
                        ? "bg-yellow-900/40 text-yellow-400"
                        : "bg-red-900/40 text-red-400"
                    }`}>
                      {product.totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      {product._count.upsells}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/produits/${product.id}/edit`} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                        <Edit2 className="h-3 w-3" /> Modifier
                      </Link>
                      <button
                        onClick={() => handleDuplicate(product.id)}
                        disabled={duplicating === product.id}
                        title="Dupliquer le produit"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-900/20 hover:bg-amber-900/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {duplicating === product.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Copy className="h-3 w-3" />}
                        Dupliquer
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link href={`/admin/produits/${product.id}/stock`} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      product.totalStock === 0
                        ? "text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40"
                        : product.totalStock <= product.lowStockAlert
                        ? "text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40"
                        : "text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40"
                    }`}>
                      <Archive className="h-3 w-3" /> Stock
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link href={`/admin/produits/${product.id}/upsells`} className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 px-3 py-1.5 rounded-lg transition-colors">
                      <Sparkles className="h-3 w-3" /> Upsells
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link href={`/admin/produits/${product.id}/variants`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors">
                      <Layers className="h-3 w-3" /> Variantes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
    </div>
  );
}
