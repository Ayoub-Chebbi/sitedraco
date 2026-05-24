import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Star, MessageCircle, Zap, Lock, CheckCircle,
  Headphones, Flame, Sparkles, Tag, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/shared/hero-carousel";
import { HomeProductsClient } from "./home-products-client";
import { PlatformTabsClient } from "./platform-tabs-client";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const productSelect = {
  id: true, name: true, slug: true, platform: true, category: true,
  price: true, discountPrice: true, imageUrl: true, soldCount: true, manualStock: true,
  productType: true, accountPrice: true, accountDiscountPrice: true, rating: true, reviewCount: true,
  _count: { select: { keys: { where: { status: "available" } } } },
  variants: { where: { isActive: true }, orderBy: { displayOrder: "asc" as const }, select: { id: true, name: true, price: true, discountPrice: true, displayOrder: true } },
};

function mapProduct(p: any) {
  return { ...p, availableKeys: (p._count?.keys ?? 0) + (p.manualStock ?? 0) };
}

async function getHeroSlides() {
  return (prisma as any).heroSlide.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } });
}

async function getNewArrivals() {
  const rows = await prisma.product.findMany({
    where: { isActive: true }, select: productSelect, orderBy: { createdAt: "desc" }, take: 8,
  });
  return rows.map(mapProduct);
}

async function getDeals() {
  const rows = await prisma.product.findMany({
    where: { isActive: true, NOT: { discountPrice: null } },
    select: productSelect, orderBy: { soldCount: "desc" }, take: 8,
  });
  return rows.map(mapProduct);
}

async function getByPlatform(platform: string) {
  const rows = await prisma.product.findMany({
    where: { isActive: true, platform },
    select: productSelect, orderBy: { soldCount: "desc" }, take: 8,
  });
  return rows.map(mapProduct);
}

async function getGiftCards() {
  const rows = await prisma.product.findMany({
    where: { isActive: true, category: "giftcard" },
    select: productSelect, orderBy: { soldCount: "desc" }, take: 8,
  });
  return rows.map(mapProduct);
}

const SERVICES = [
  { icon: Zap,          color: "text-yellow-400 bg-yellow-900/20 border-yellow-800/40", title: "Livraison rapide",     desc: "Clés livrées en 15 à 60 min" },
  { icon: Lock,         color: "text-green-400 bg-green-900/20 border-green-800/40",    title: "Paiement sécurisé",    desc: "D17, Flouci, virement" },
  { icon: CheckCircle,  color: "text-blue-400 bg-blue-900/20 border-blue-800/40",       title: "Satisfaction garantie",desc: "Remboursement si problème" },
  { icon: Headphones,   color: "text-purple-400 bg-purple-900/20 border-purple-800/40", title: "Support 7j/7",         desc: "On répond vite sur WhatsApp" },
];

const CATEGORIES = [
  { label: "Jeux PS5",        href: "/produits?platform=ps5",          emoji: "🎮", bg: "from-blue-900/60 to-blue-950/80 border-blue-800/50 hover:border-blue-600/70" },
  { label: "PC / Steam",      href: "/produits?platform=steam",        emoji: "💻", bg: "from-sky-900/60 to-sky-950/80 border-sky-800/50 hover:border-sky-600/70" },
  { label: "Xbox",            href: "/produits?platform=xbox",         emoji: "🟢", bg: "from-green-900/60 to-green-950/80 border-green-800/50 hover:border-green-600/70" },
  { label: "Nintendo",        href: "/produits?platform=nintendo",     emoji: "🔴", bg: "from-red-900/60 to-red-950/80 border-red-800/50 hover:border-red-600/70" },
  { label: "Cartes Cadeaux",  href: "/produits?category=giftcard",     emoji: "🎁", bg: "from-purple-900/60 to-purple-950/80 border-purple-800/50 hover:border-purple-600/70" },
  { label: "Abonnements",     href: "/produits?category=subscription", emoji: "⭐", bg: "from-yellow-900/60 to-yellow-950/80 border-yellow-800/50 hover:border-yellow-600/70" },
];

const TESTIMONIALS = [
  { name: "Ahmed B.",   rating: 5, text: "Clé reçue en 20 minutes chrono. Service impeccable !",                 platform: "Steam" },
  { name: "Rania M.",   rating: 5, text: "Interface claire, paiement facile et support réactif.",                platform: "PS5" },
  { name: "Youssef K.", rating: 5, text: "Meilleure boutique pour les jeux en Tunisie. Je recommande à 100%.", platform: "Xbox" },
];

function SectionHeader({ title, icon: Icon, iconColor, href, linkLabel = "Voir tout" }: {
  title: string; icon?: React.ElementType; iconColor?: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-purple-500 rounded-full shrink-0" />
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconColor ?? "text-purple-400"}`} />}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-400 transition-colors">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [heroSlides, newArrivals, deals, ps5, ps4, xbox, nintendo, pc, steam, mobile, giftCards] =
    await Promise.all([
      getHeroSlides(),
      getNewArrivals(),
      getDeals(),
      getByPlatform("ps5"),
      getByPlatform("ps4"),
      getByPlatform("xbox"),
      getByPlatform("nintendo"),
      getByPlatform("pc"),
      getByPlatform("steam"),
      getByPlatform("mobile"),
      getGiftCards(),
    ]);

  const platforms = { ps5, ps4, xbox, nintendo, pc, steam, mobile };
  const hasPlatformProducts = Object.values(platforms).some((arr) => arr.length > 0);

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Hero Carousel ── */}
      <HeroCarousel slides={heroSlides.length > 0 ? heroSlides : undefined} />

      {/* ── Service Strip ── */}
      <div className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SERVICES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className={`flex items-center gap-3 p-3 rounded-xl border ${color}`}>
                <div className={`p-2 rounded-lg ${color} shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nouveautés ── */}
      {newArrivals.length > 0 && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="Nouveautés" icon={Sparkles} iconColor="text-pink-400" href="/produits" />
            <HomeProductsClient products={newArrivals} />
          </div>
        </section>
      )}

      {/* ── Top Promos ── */}
      {deals.length > 0 && (
        <section className="py-10 bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="Top Promos" icon={Flame} iconColor="text-orange-400" href="/produits" />
            {/* savings chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {deals.slice(0, 4).map((p: any) => {
                const saved = p.price - (p.discountPrice ?? p.price);
                if (saved <= 0) return null;
                return (
                  <div key={p.id} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-900/30 border border-red-700/40 text-xs font-medium text-red-300">
                    <Tag className="h-3 w-3" />
                    {p.name.split(" ").slice(0, 3).join(" ")} — économisez {formatPrice(saved)}
                  </div>
                );
              })}
            </div>
            <HomeProductsClient products={deals} />
          </div>
        </section>
      )}

      {/* ── Jeux par Plateforme ── */}
      {hasPlatformProducts && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="Jeux par Plateforme" icon={Sparkles} iconColor="text-purple-400" />
            <PlatformTabsClient platforms={platforms} />
          </div>
        </section>
      )}

      {/* ── Cartes Cadeaux & Abonnements ── */}
      {giftCards.length > 0 && (
        <section className="py-10 bg-gray-900/40">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="Cartes Cadeaux & Abonnements" icon={Gift} iconColor="text-purple-400" href="/produits?category=giftcard" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {giftCards.map((card: any) => (
                <Link
                  key={card.id}
                  href={`/produits/${card.slug}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/50 hover:bg-gray-800 transition-all"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-800">
                    {card.imageUrl
                      ? <Image src={card.imageUrl} alt={card.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized={card.imageUrl.startsWith("/uploads")} />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
                    }
                  </div>
                  <p className="text-xs font-medium text-gray-300 text-center leading-tight line-clamp-2">{card.name}</p>
                  <p className="text-sm font-bold text-white">{formatPrice(card.discountPrice ?? card.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Catégories ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="Explorer par catégorie" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border bg-linear-to-b ${c.bg} transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-black/30`}
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-sm font-semibold text-gray-200 text-center">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avis clients ── */}
      <section className="py-10 bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="Avis de nos clients" icon={Star} iconColor="text-yellow-400" />
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-5 rounded-xl border border-gray-800 bg-gray-900">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">{t.name}</span>
                  <span className="text-xs text-gray-600">via {t.platform}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Comment ça marche ?</h2>
            <p className="text-gray-500 text-sm">Simple, rapide, sécurisé</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", emoji: "🛒", title: "Choisissez",       desc: "Parcourez le catalogue et ajoutez au panier" },
              { step: "02", emoji: "💳", title: "Payez",            desc: "D17, Flouci, Paymee ou virement bancaire" },
              { step: "03", emoji: "⚡", title: "On traite",        desc: "Vérification du paiement en quelques minutes" },
              { step: "04", emoji: "🔑", title: "Recevez votre clé",desc: "Dans votre espace client et par email" },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center p-6 rounded-xl border border-gray-800 bg-gray-900">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {item.step}
                </div>
                <div className="text-3xl mb-3 mt-1">{item.emoji}</div>
                <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 bg-linear-to-r from-purple-950/80 via-gray-900 to-pink-950/50 border-y border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Prêt à jouer ?</h2>
            <p className="text-gray-400 text-sm">Créez votre compte et recevez vos clés en quelques minutes.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/inscription">
              <Button size="lg" className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 gap-2 font-semibold shadow-lg shadow-purple-900/30">
                Créer mon compte <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? "21600000000"}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 border-gray-700 hover:border-green-600 hover:text-green-400">
                <MessageCircle className="h-4 w-4 text-green-400" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
