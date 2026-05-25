"use client";

import { useState } from "react";
import { HomeProductsClient } from "./home-products-client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductWithKeyCount } from "@/types";

type Tab = { key: string; label: string; emoji: string };
type ExtProduct = ProductWithKeyCount & { availableKeys: number; soldCount?: number };

export function PlatformTabsClient({ platforms, tabs }: { platforms: Record<string, ExtProduct[]>; tabs: Tab[] }) {
  const available = tabs.filter((t) => (platforms[t.key]?.length ?? 0) > 0);
  const [active, setActive] = useState(available[0]?.key ?? "");

  if (available.length === 0) return null;

  const products = platforms[active] ?? [];
  const activeTab = available.find((t) => t.key === active);

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {available.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              active === tab.key
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {products.length > 0 ? (
        <>
          <HomeProductsClient products={products} />
          <div className="mt-4 text-center">
            <Link
              href={`/produits?platform=${active}`}
              className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Voir tous les jeux {activeTab?.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <p className="text-3xl mb-3">🎮</p>
          <p className="text-sm">Aucun produit disponible pour cette plateforme.</p>
        </div>
      )}
    </div>
  );
}
