"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CreditCard, Shield, Lock, Zap, Tag, X, CheckCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

type CouponResult = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discount: number;
};

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, total, clearCart } = useCart();
  const [email, setEmail] = useState(session?.user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const [steamUsername, setSteamUsername] = useState("");
  const needsSteam = items.some((i) => i.requiresSteamUsername);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-400 mb-4">Votre panier est vide.</p>
        <Link href="/produits"><Button>Parcourir le catalogue</Button></Link>
      </div>
    );
  }

  const subtotal = total();
  const discount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);

  async function applyCode() {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim(), amount: subtotal }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) {
      setCouponError(data.error || "Code invalide.");
    } else {
      setAppliedCoupon(data);
      setCouponInput("");
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError("");
  }

  async function initiatePayment() {
    setError("");
    if (!email.includes("@")) {
      setError("Entrez un email valide.");
      return;
    }
    if (needsSteam && !steamUsername.trim()) {
      setError("Veuillez entrer votre pseudo Steam.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/flouci/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            ...(i.variantId && { variantId: i.variantId }),
          })),
          ...(appliedCoupon && { couponCode: appliedCoupon.code }),
          ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de paiement.");
      clearCart();
      window.location.href = data.paymentUrl;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Finaliser la commande</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: email + coupon + pay */}
        <div className="md:col-span-2 space-y-4">
          {/* Email */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Email de réception</h2>
            <Input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!session && (
              <p className="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3">
                Pas de compte requis. Votre clé sera envoyée à cet email.
              </p>
            )}
          </div>

          {/* Steam username */}
          {needsSteam && (
            <div className="rounded-xl border border-blue-800/50 bg-blue-900/10 p-6 space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-blue-400" />
                Pseudo Steam requis
              </h2>
              <p className="text-sm text-gray-400">
                Ce produit est offert en cadeau via Steam. Entrez votre pseudo Steam exact pour que nous puissions vous ajouter en ami et envoyer le cadeau.
              </p>
              <Input
                placeholder="VotrePseudoSteam"
                value={steamUsername}
                onChange={(e) => setSteamUsername(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Retrouvez votre pseudo dans votre profil Steam → <span className="text-blue-400">Modifier le profil → Nom d&apos;utilisateur</span>
              </p>
            </div>
          )}

          {/* Coupon */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-400" />
              Code promo
            </h2>

            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-green-900/20 border border-green-700/40 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-300">{appliedCoupon.code}</p>
                    <p className="text-xs text-gray-400">
                      {appliedCoupon.type === "percentage"
                        ? `${appliedCoupon.value}% de réduction`
                        : `${formatPrice(appliedCoupon.value)} de réduction`}
                      {" · "}
                      <span className="text-green-400">-{formatPrice(appliedCoupon.discount)}</span>
                    </p>
                  </div>
                </div>
                <button onClick={removeCoupon} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ex : PROMO20"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCode()}
                  className="uppercase placeholder:normal-case"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyCode}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0"
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                </Button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-red-400">{couponError}</p>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-purple-800/40 bg-gray-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Paiement sécurisé</h2>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-purple-600 bg-purple-600/10">
              <div className="w-10 h-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Carte bancaire</p>
                <p className="text-xs text-gray-400">Visa, Mastercard — Paiement sécurisé</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-4 py-2">{error}</p>
            )}

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={initiatePayment}
              disabled={loading || !email.includes("@")}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers le paiement…</>
              ) : (
                <><Lock className="h-4 w-4" /> Payer {formatPrice(finalTotal)} · Carte bancaire</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-6 pt-1">
              {[
                { icon: Shield, text: "Paiement sécurisé SSL" },
                { icon: Zap, text: "Livraison en 1 à 6h" },
                { icon: Lock, text: "Données chiffrées" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Icon className="h-3.5 w-3.5 text-green-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="sticky top-20 self-start">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Votre commande</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="relative w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">
                    {formatPrice((item.discountPrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sous-total</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {appliedCoupon?.code}
                  </span>
                  <span className="text-green-400">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-gray-800">
                <span className="text-white">Total</span>
                <span className="text-purple-300 text-lg">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
