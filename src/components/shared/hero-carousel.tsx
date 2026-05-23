"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Shield, Star, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  price: number;
  discountPrice?: number | null;
  href: string;
  imageUrl: string;
  gradient: string;
  accentColor: string;
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "1",
    title: "Bienvenue sur Loot",
    subtitle: "Jeux numériques, cartes prépayées et abonnements livrés en quelques minutes.",
    badge: "🎮 Nouveauté",
    price: 0,
    href: "/produits",
    imageUrl: "",
    gradient: "from-purple-950 via-purple-900/80 to-indigo-950",
    accentColor: "text-purple-400",
  },
  {
    id: "2",
    title: "Steam — Recharge rapide",
    subtitle: "Rechargez votre Steam Wallet en quelques minutes. Paiement sécurisé via D17 ou Flouci.",
    badge: "💻 PC Gaming",
    price: 0,
    href: "/produits?platform=steam",
    imageUrl: "",
    gradient: "from-sky-950 via-blue-900/80 to-gray-950",
    accentColor: "text-sky-400",
  },
  {
    id: "3",
    title: "PlayStation Plus 12 Mois",
    subtitle: "Un an de jeux gratuits, multijoueur illimité et réductions exclusives PlayStation.",
    badge: "⭐ Best-seller",
    price: 0,
    href: "/produits?platform=ps5",
    imageUrl: "",
    gradient: "from-blue-950 via-indigo-900/80 to-gray-950",
    accentColor: "text-blue-400",
  },
  {
    id: "4",
    title: "Xbox Game Pass Ultimate",
    subtitle: "Plus de 100 jeux inclus, multijoueur en ligne et EA Play — tout-en-un.",
    badge: "🟢 Xbox",
    price: 0,
    href: "/produits?platform=xbox",
    imageUrl: "",
    gradient: "from-green-950 via-emerald-900/80 to-gray-950",
    accentColor: "text-green-400",
  },
];

export function HeroCarousel({ slides = DEFAULT_SLIDES }: { slides?: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating]);

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative h-[75vh] min-h-135 max-h-195 overflow-hidden bg-gray-950">
      {/* Background */}
      <div className={`absolute inset-0 bg-linear-to-br ${slide.gradient} transition-all duration-700`} key={slide.id}>
        {slide.imageUrl && (
          <>
            <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Main content — absolutely positioned so it's always fully visible */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 pb-16">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-widest mb-5 ${slide.accentColor}`}>
              <Zap className="h-3 w-3" />
              {slide.badge}
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href={slide.href}>
                <Button size="lg" className="gap-2 bg-white text-black hover:bg-gray-100 font-bold shadow-xl">
                  Découvrir l&apos;offre <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/produits">
                <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10 font-semibold">
                  Toute la boutique
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip — pinned to bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Shield className="h-4 w-4 text-green-400 shrink-0" />
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Zap className="h-4 w-4 text-yellow-400 shrink-0" />
            Livraison instantanée
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Headphones className="h-4 w-4 text-purple-400 shrink-0" />
            Support 7j/7
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300 ml-auto">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
            <span><span className="text-white font-bold">4.9</span> / 5 · 2 300 avis</span>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Précédent">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors" aria-label="Suivant">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={`transition-all rounded-full ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
}
