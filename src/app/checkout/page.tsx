"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CreditCard, ChevronRight, Shield, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, total, clearCart } = useCart();
  const [email, setEmail] = useState(session?.user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-400 mb-4">Votre panier est vide.</p>
        <Link href="/produits"><Button>Parcourir le catalogue</Button></Link>
      </div>
    );
  }

  async function initiatePayment() {
    setError("");
    if (!email.includes("@")) {
      setError("Entrez un email valide.");
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
          })),
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
        {/* Left: email + pay button */}
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

          {/* Flouci card payment */}
          <div className="rounded-xl border border-purple-800/40 bg-gray-900 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Paiement sécurisé</h2>

            {/* Card method display */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-purple-600 bg-purple-600/10">
              <div className="w-10 h-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Carte bancaire</p>
                <p className="text-xs text-gray-400">Visa, Mastercard — Paiement via Flouci</p>
              </div>
              <img
                src="https://flouci.com/favicon.ico"
                alt="Flouci"
                className="ml-auto h-6 w-6 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
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
                <><Loader2 className="h-4 w-4 animate-spin" /> Redirection vers Flouci…</>
              ) : (
                <><Lock className="h-4 w-4" /> Payer {formatPrice(total())} · Carte bancaire</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-6 pt-1">
              {[
                { icon: Shield, text: "Paiement sécurisé SSL" },
                { icon: Zap, text: "Livraison instantanée" },
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
                <div key={item.productId} className="flex gap-3">
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
            <div className="border-t border-gray-800 pt-3 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-purple-300 text-lg">{formatPrice(total())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
