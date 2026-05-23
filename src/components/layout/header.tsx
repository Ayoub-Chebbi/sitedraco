"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart, LogOut, LayoutDashboard, Search, Shield,
  Menu, X, ChevronRight, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

type SubItem = { label: string; href: string; emoji: string; desc?: string };
type NavItem = {
  label: string; href: string; emoji: string;
  hover: string; activeColor: string;
  dropdown?: SubItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "PC / Steam", href: "/produits?platform=steam", emoji: "💻",
    hover: "hover:bg-sky-950/60 hover:text-sky-300", activeColor: "text-sky-300 bg-sky-950/60",
    dropdown: [
      { label: "Jeux PC",         href: "/produits?platform=steam&category=game",     emoji: "🎮", desc: "Tous les jeux Steam" },
      { label: "DLC & Extensions",href: "/produits?platform=steam&category=dlc",      emoji: "🧩", desc: "Contenus additionnels" },
      { label: "Crédits Steam",   href: "/produits?platform=steam&category=credit",   emoji: "💳", desc: "Solde Steam Wallet" },
      { label: "Cartes cadeaux",  href: "/produits?platform=steam&category=giftcard", emoji: "🎁", desc: "Gift cards Steam" },
    ],
  },
  {
    label: "PlayStation", href: "/produits?platform=ps5", emoji: "🎮",
    hover: "hover:bg-blue-950/60 hover:text-blue-300", activeColor: "text-blue-300 bg-blue-950/60",
    dropdown: [
      { label: "PS5 — Jeux",   href: "/produits?platform=ps5&category=game",         emoji: "🎮", desc: "Exclusivités & multi" },
      { label: "PS5 — DLC",    href: "/produits?platform=ps5&category=dlc",          emoji: "🧩", desc: "Extensions & pass" },
      { label: "PS4 — Jeux",   href: "/produits?platform=ps4&category=game",         emoji: "🕹️", desc: "Bibliothèque PS4" },
      { label: "PS4 — DLC",    href: "/produits?platform=ps4&category=dlc",          emoji: "🧩", desc: "Contenus additionnels" },
      { label: "PS Plus",      href: "/produits?platform=ps5&category=subscription", emoji: "⭐", desc: "Essential, Extra, Premium" },
      { label: "Cartes PSN",   href: "/produits?platform=ps5&category=giftcard",     emoji: "🎁", desc: "Crédit PlayStation Store" },
    ],
  },
  {
    label: "Xbox", href: "/produits?platform=xbox", emoji: "🟢",
    hover: "hover:bg-green-950/60 hover:text-green-300", activeColor: "text-green-300 bg-green-950/60",
    dropdown: [
      { label: "Jeux Xbox",    href: "/produits?platform=xbox&category=game",         emoji: "🎮", desc: "Xbox Series & One" },
      { label: "DLC Xbox",     href: "/produits?platform=xbox&category=dlc",          emoji: "🧩", desc: "Extensions de jeux" },
      { label: "Game Pass",    href: "/produits?platform=xbox&category=subscription", emoji: "⭐", desc: "Core, PC & Ultimate" },
      { label: "Cartes Xbox",  href: "/produits?platform=xbox&category=giftcard",     emoji: "🎁", desc: "Crédit Microsoft Store" },
    ],
  },
  {
    label: "Nintendo", href: "/produits?platform=nintendo", emoji: "🔴",
    hover: "hover:bg-red-950/60 hover:text-red-300", activeColor: "text-red-300 bg-red-950/60",
    dropdown: [
      { label: "Jeux Nintendo",    href: "/produits?platform=nintendo&category=game",         emoji: "🎮", desc: "Switch & eShop" },
      { label: "DLC Nintendo",     href: "/produits?platform=nintendo&category=dlc",          emoji: "🧩", desc: "DLC & Expansion Pass" },
      { label: "Nintendo Online",  href: "/produits?platform=nintendo&category=subscription", emoji: "⭐", desc: "Individuel & Famille" },
    ],
  },
  {
    label: "Mobile", href: "/produits?platform=mobile", emoji: "📱",
    hover: "hover:bg-orange-950/60 hover:text-orange-300", activeColor: "text-orange-300 bg-orange-950/60",
    dropdown: [
      { label: "Jeux Mobile", href: "/produits?platform=mobile&category=game",   emoji: "🎮", desc: "Android & iOS" },
      { label: "Crédits",     href: "/produits?platform=mobile&category=credit", emoji: "💳", desc: "Top-up & recharges" },
    ],
  },
  {
    label: "Cartes cadeaux", href: "/produits?category=giftcard", emoji: "🎁",
    hover: "hover:bg-purple-950/60 hover:text-purple-300", activeColor: "text-purple-300 bg-purple-950/60",
    dropdown: [
      { label: "Steam",        href: "/produits?platform=steam&category=giftcard",     emoji: "💻" },
      { label: "PlayStation",  href: "/produits?platform=ps5&category=giftcard",       emoji: "🎮" },
      { label: "Xbox",         href: "/produits?platform=xbox&category=giftcard",      emoji: "🟢" },
      { label: "Nintendo",     href: "/produits?platform=nintendo&category=giftcard",  emoji: "🔴" },
      { label: "Mobile",       href: "/produits?platform=mobile&category=giftcard",    emoji: "📱" },
    ],
  },
  {
    label: "Abonnements", href: "/produits?category=subscription", emoji: "⭐",
    hover: "hover:bg-yellow-950/60 hover:text-yellow-300", activeColor: "text-yellow-300 bg-yellow-950/60",
    dropdown: [
      { label: "PS Plus",         href: "/produits?platform=ps5&category=subscription",      emoji: "🎮", desc: "Essential, Extra, Premium" },
      { label: "Xbox Game Pass",  href: "/produits?platform=xbox&category=subscription",     emoji: "🟢", desc: "Core, PC & Ultimate" },
      { label: "Nintendo Online", href: "/produits?platform=nintendo&category=subscription", emoji: "🔴", desc: "Individuel & Famille" },
    ],
  },
];

type SearchResult = {
  id: string; name: string; slug: string; platform: string;
  price: number; discountPrice: number | null; imageUrl: string | null;
  _count: { keys: number };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Header() {
  const { data: session } = useSession();
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openDropdown(label: string) {
    clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  }
  function closeDropdown() {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 120);
  }
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setSearchOpen(false); return; }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => { setResults(data); setSearchOpen(data.length > 0); })
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function clearSearch() { setQuery(""); setResults([]); setSearchOpen(false); }

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-950 border-b border-gray-800 shadow-xl shadow-black/30">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
              <span className="font-black text-black text-lg leading-none">L</span>
            </div>
            <span className="font-black text-lg text-white hidden sm:block tracking-widest uppercase">
              Loot
            </span>
          </Link>

          {/* Search */}
          <div ref={searchRef} className="flex-1 relative hidden md:block">
            <div className={`flex items-center gap-2 h-10 px-4 rounded-xl border transition-all ${query ? "border-purple-500/60 bg-gray-800 ring-1 ring-purple-500/20" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}>
              <Search className={`h-4 w-4 shrink-0 transition-colors ${searching ? "text-purple-400 animate-pulse" : "text-gray-500"}`} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setSearchOpen(true)}
                placeholder="Chercher un jeu, une carte, une plateforme…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
              {query && (
                <button onClick={clearSearch} className="text-gray-600 hover:text-gray-300 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown — closes when mouse leaves the dropdown itself */}
            {searchOpen && results.length > 0 && (
              <div
                onMouseLeave={() => setSearchOpen(false)}
                className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/60 overflow-hidden z-50"
              >
                <div className="px-3 py-2 border-b border-gray-800 bg-gray-900">
                  <p className="text-xs text-gray-500">{results.length} résultat{results.length > 1 ? "s" : ""} pour «&nbsp;{query}&nbsp;»</p>
                </div>
                <ul className="bg-gray-900">
                  {results.map((r) => {
                    const price = r.discountPrice ?? r.price;
                    const hasDiscount = r.discountPrice && r.discountPrice < r.price;
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/produits/${r.slug}`}
                          onClick={clearSearch}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                            {r.imageUrl
                              ? <Image src={r.imageUrl} alt={r.name} fill className="object-cover" unoptimized={r.imageUrl.startsWith("/uploads")} />
                              : <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{r.name}</p>
                            <PlatformBadge platform={r.platform} />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-white">{formatPrice(price)}</p>
                            {hasDiscount && <p className="text-xs text-gray-500 line-through">{formatPrice(r.price)}</p>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={`/produits?q=${encodeURIComponent(query)}`}
                  onClick={clearSearch}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-purple-400 hover:bg-purple-950/40 border-t border-gray-800 bg-gray-900 transition-colors"
                >
                  Voir tous les résultats <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => { setMobileSearch(!mobileSearch); if (!mobileSearch) setTimeout(() => inputRef.current?.focus(), 50); }}
            >
              <Search className="h-5 w-5" />
            </button>

            <Link href="/panier" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {mounted && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {session ? (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                    </div>
                    <span className="max-w-20 truncate">{session.user.name ?? session.user.email}</span>
                  </button>
                </Link>
                {(session.user.role === "admin" || session.user.role === "support") && (
                  <Link href="/admin" title="Administration" className="p-1.5 rounded-lg hover:bg-purple-900/30 transition-colors">
                    <Shield className="h-3.5 w-3.5 text-purple-400 hover:text-purple-300" />
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/connexion">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">Connexion</Button>
                </Link>
                <Link href="/inscription">
                  <Button size="sm" className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-900/30 font-semibold">
                    S&apos;inscrire
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearch && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-purple-500/60 bg-gray-800">
                <Search className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setSearchOpen(true)}
                  placeholder="Chercher…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  autoFocus
                />
                {query && <button onClick={clearSearch}><X className="h-3.5 w-3.5 text-gray-500" /></button>}
              </div>
              {searchOpen && results.length > 0 && (
                <div
                  onMouseLeave={() => setSearchOpen(false)}
                  className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50"
                >
                  <ul>
                    {results.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <Link href={`/produits/${r.slug}`} onClick={() => { clearSearch(); setMobileSearch(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition-colors">
                          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-gray-800 shrink-0">
                            {r.imageUrl
                              ? <Image src={r.imageUrl} alt={r.name} fill className="object-cover" unoptimized={r.imageUrl.startsWith("/uploads")} />
                              : <div className="w-full h-full flex items-center justify-center">🎮</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{r.name}</p>
                          </div>
                          <p className="text-sm font-bold text-white shrink-0">{formatPrice(r.discountPrice ?? r.price)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Platform categories bar with dropdowns */}
      <div className="border-t border-gray-800/80 bg-gray-900/60 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 overflow-visible">
          <nav className="hidden md:flex items-center gap-0.5 py-1.5">
            {NAV_ITEMS.map((item) => {
              const isOpen = activeDropdown === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.dropdown && openDropdown(item.label)}
                  onMouseLeave={closeDropdown}
                >
                  <Link
                    href={item.href}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-400 transition-all ${item.hover} ${isOpen ? item.activeColor : ""}`}
                  >
                    <span className="text-base leading-none">{item.emoji}</span>
                    {item.label}
                    {item.dropdown && (
                      <ChevronDown className={`h-3 w-3 ml-0.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
                    )}
                  </Link>

                  {/* Dropdown panel */}
                  {item.dropdown && isOpen && (
                    <div className="absolute top-full left-0 pt-1 z-200 min-w-52">
                      <div className="rounded-xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/60 overflow-hidden">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors group/sub"
                          >
                            <span className="text-base w-5 text-center leading-none">{sub.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-300 group-hover/sub:text-white transition-colors">
                                {sub.label}
                              </p>
                              {sub.desc && (
                                <p className="text-xs text-gray-600 group-hover/sub:text-gray-400 transition-colors truncate">
                                  {sub.desc}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-3 w-3 text-gray-700 group-hover/sub:text-gray-400 shrink-0 transition-colors" />
                          </Link>
                        ))}
                        <Link
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 border-t border-gray-800 transition-colors"
                        >
                          Voir tout {item.label}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-4 space-y-4">
          <nav className="grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((c) => (
              <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <span>{c.emoji}</span>{c.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="h-4 w-4" />Mon espace
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full gap-2 text-red-400"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}>
                  <LogOut className="h-4 w-4" />Se déconnecter
                </Button>
              </>
            ) : (
              <>
                <Link href="/connexion" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Connexion</Button>
                </Link>
                <Link href="/inscription" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">S&apos;inscrire</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
