"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Filter, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { QuickViewModal } from "@/components/shared/quick-view-modal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/lib/use-toast";
import type { Product } from "@/types";

const STATIC_PLATFORMS = [
  { value: "", label: "Toutes" },
  { value: "ps5", label: "PS5" },
  { value: "ps4", label: "PS4" },
  { value: "xbox", label: "Xbox" },
  { value: "pc", label: "PC" },
  { value: "steam", label: "Steam" },
  { value: "nintendo", label: "Nintendo" },
  { value: "mobile", label: "Mobile" },
];

const DEFAULT_CATEGORIES = [
  { slug: "game",         label: "Jeu complet" },
  { slug: "dlc",          label: "DLC" },
  { slug: "subscription", label: "Abonnement" },
  { slug: "credit",       label: "Crédit" },
  { slug: "giftcard",     label: "Carte cadeau" },
];

const SORTS = [
  { value: "newest", label: "Nouveautés" },
  { value: "popular", label: "Popularité" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

type ProductVariant = { id: string; name: string; price: number; discountPrice?: number | null; displayOrder: number };
type ExtProduct = Product & {
  availableKeys: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  accountPrice?: number | null;
  accountDiscountPrice?: number | null;
  variants?: ProductVariant[];
};

type Props = {
  products: ExtProduct[];
  categories?: { slug: string; label: string }[];
  giftcardBrands?: string[];
  platforms?: { value: string; label: string }[];
  initialPlatform?: string;
  initialCategory?: string;
  initialBrand?: string;
};

export function ProductsClient({ products, categories: propCategories, giftcardBrands = [], platforms: propPlatforms, initialPlatform = "", initialCategory = "", initialBrand = "" }: Props) {
  const categoryList = propCategories ?? DEFAULT_CATEGORIES;
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  const platform = initialPlatform;
  const category = initialCategory;
  const brand = initialBrand;

  const [sort, setSort] = useState("newest");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [quickViewProduct, setQuickViewProduct] = useState<ExtProduct | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [
    platform !== "",
    category !== "",
    brand !== "",
    onlyInStock,
    maxPrice < 500,
  ].filter(Boolean).length;

  function navigate(nextPlatform: string, nextCategory: string, nextBrand = "") {
    const params = new URLSearchParams();
    if (nextPlatform) params.set("platform", nextPlatform);
    if (nextCategory) params.set("category", nextCategory);
    if (nextBrand) params.set("brand", nextBrand);
    const qs = params.toString();
    router.push(`/produits${qs ? `?${qs}` : ""}`);
  }

  function reset() {
    setSort("newest");
    setOnlyInStock(false);
    setMaxPrice(500);
    router.push("/produits");
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (onlyInStock) list = list.filter((p) => p.availableKeys > 0);
    list = list.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
    if (sort === "popular")    list.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    if (sort === "price_asc")  list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "price_desc") list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    return list;
  }, [products, sort, onlyInStock, maxPrice]);

  function handleAddToCart(product: Product, variant?: "key" | "account", variantId?: string, variantName?: string, variantPrice?: number, variantDiscountPrice?: number | null) {
    const p = product as Product & { accountPrice?: number | null; accountDiscountPrice?: number | null };
    if (variantId && variantName) {
      addItem({
        productId: product.id,
        variantId,
        variantName,
        name: `${product.name} — ${variantName}`,
        price: variantPrice ?? product.price,
        discountPrice: variantDiscountPrice,
        imageUrl: product.imageUrl,
        platform: product.platform,
        quantity: 1,
      });
    } else {
      const isAccount = variant === "account";
      const price = isAccount ? (p.accountPrice ?? product.price) : product.price;
      const discountPrice = isAccount ? (p.accountDiscountPrice ?? null) : product.discountPrice;
      addItem({
        productId: product.id,
        variant,
        name: variant ? `${product.name} (${variant === "key" ? "Clé" : "Compte"})` : product.name,
        price,
        discountPrice,
        imageUrl: product.imageUrl,
        platform: product.platform,
        quantity: 1,
      });
    }
    toast({ title: "Ajouté au panier", description: product.name, variant: "success" });
  }

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plateforme</p>
        <div className="flex flex-wrap gap-1.5">
          {[{ value: "", label: "Toutes" }, ...(propPlatforms ?? STATIC_PLATFORMS.slice(1))].map((p) => (
            <button
              key={p.value}
              onClick={() => p.value === "" ? navigate("", category, brand) : navigate(p.value, "", "")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${platform === p.value ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Catégorie</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate(platform, "", "")}
            className={`px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${category === "" ? "bg-purple-600/20 text-purple-300 border border-purple-600/40" : "text-gray-400 hover:bg-gray-800"}`}
          >
            Tous
          </button>
          {categoryList.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate("", c.slug, "")}
              className={`px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${category === c.slug ? "bg-purple-600/20 text-purple-300 border border-purple-600/40" : "text-gray-400 hover:bg-gray-800"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {category === "giftcard" && giftcardBrands.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marque</p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate(platform, category, "")}
              className={`px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${brand === "" ? "bg-purple-600/20 text-purple-300 border border-purple-600/40" : "text-gray-400 hover:bg-gray-800"}`}
            >
              Toutes
            </button>
            {giftcardBrands.map((b) => (
              <button
                key={b}
                onClick={() => navigate(platform, category, b)}
                className={`px-3 py-1.5 rounded-lg text-sm text-left transition-colors ${brand === b ? "bg-purple-600/20 text-purple-300 border border-purple-600/40" : "text-gray-400 hover:bg-gray-800"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix max : {maxPrice} TND</p>
        <input
          type="range" min={10} max={500} step={10}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-purple-600"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyInStock}
          onChange={(e) => setOnlyInStock(e.target.checked)}
          className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-sm text-gray-400">En stock uniquement</span>
      </label>

      <Button variant="ghost" size="sm" className="w-full text-gray-500" onClick={reset}>
        Réinitialiser
      </Button>
    </div>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Catalogue</h1>
            <p className="text-sm text-gray-500">{filtered.length} produit{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              className="lg:hidden flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white transition-colors"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-500 hidden sm:block" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile filter panel — collapsible */}
        {filtersOpen && (
          <div className="lg:hidden rounded-xl border border-gray-800 bg-gray-900 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Filtres</h3>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterPanel}
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 sticky top-20">
              <div className="flex items-center gap-2 mb-5">
                <Filter className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Filtres</h3>
              </div>
              {filterPanel}
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={(p) => setQuickViewProduct(p as ExtProduct)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-gray-400">Aucun produit trouvé</p>
                <p className="text-sm mt-2">Modifiez vos filtres</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
