"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, CreditCard, Shield, Lock, Zap, Tag, X,
  CheckCircle, Gamepad2, Upload, Copy, Check, Smartphone,
  Building2, ChevronRight, ImageIcon, Package, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { trackInitiateCheckout } from "@/components/shared/meta-pixel";
import { UpsellSection } from "@/components/shared/upsell-section";

type CouponResult = {
  id: string; code: string; type: "percentage" | "fixed"; value: number; discount: number;
};

type UpsellProduct = {
  id: string; name: string; slug: string; price: number; discountPrice: number | null;
  imageUrl: string | null; platform: string; category: string; availableKeys: number;
};

type PaymentMethod = "carte" | "d17" | "flouci_app" | "virement";

const PAYMENT_METHODS: {
  id: PaymentMethod; label: string; desc: string;
  icon: React.ReactNode; color: string; needsProof: boolean;
}[] = [
  {
    id: "carte",
    label: "Carte bancaire",
    desc: "Visa, Mastercard · Paiement 100% sécurisé",
    icon: <CreditCard className="h-5 w-5" />,
    color: "purple",
    needsProof: false,
  },
  {
    id: "d17",
    label: "D17",
    desc: "56 190 577 · 96 780 440",
    icon: <Smartphone className="h-5 w-5" />,
    color: "blue",
    needsProof: true,
  },
  {
    id: "flouci_app",
    label: "Flouci (app)",
    desc: "58 960 645",
    icon: <Smartphone className="h-5 w-5" />,
    color: "green",
    needsProof: true,
  },
  {
    id: "virement",
    label: "Virement bancaire",
    desc: "RIB : 24 031 201 5632 512201 69",
    icon: <Building2 className="h-5 w-5" />,
    color: "amber",
    needsProof: true,
  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; icon: string; text: string; radio: string }> = {
  purple: { border: "border-purple-600",   bg: "bg-purple-600/10",  icon: "text-purple-400 bg-purple-900/50",  text: "text-purple-300", radio: "border-purple-500 bg-purple-500" },
  blue:   { border: "border-blue-600",     bg: "bg-blue-600/10",    icon: "text-blue-400   bg-blue-900/50",    text: "text-blue-300",   radio: "border-blue-500 bg-blue-500"   },
  green:  { border: "border-green-600",    bg: "bg-green-600/10",   icon: "text-green-400  bg-green-900/50",   text: "text-green-300",  radio: "border-green-500 bg-green-500" },
  amber:  { border: "border-amber-600",    bg: "bg-amber-600/10",   icon: "text-amber-400  bg-amber-900/50",   text: "text-amber-300",  radio: "border-amber-500 bg-amber-500" },
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-2 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
      title="Copier"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ManualPaymentDetails({ method }: { method: PaymentMethod }) {
  const colors = { d17: "blue", flouci_app: "green", virement: "amber" } as const;
  const color = colors[method as keyof typeof colors];
  const c = COLOR_MAP[color];

  if (method === "d17") return (
    <div className={`rounded-xl border ${c.border}/40 ${c.bg} p-4 space-y-3`}>
      <p className={`text-sm font-semibold ${c.text}`}>Envoyez le montant via D17 à :</p>
      <div className="space-y-2">
        {[["56 190 577", "56190577"], ["96 780 440", "96780440"]].map(([display, value]) => (
          <div key={value} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
            <span className="font-mono text-white text-sm tracking-wider">{display}</span>
            <CopyBtn value={value} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Après le transfert, téléchargez la capture d'écran ci-dessous.</p>
    </div>
  );

  if (method === "flouci_app") return (
    <div className={`rounded-xl border ${c.border}/40 ${c.bg} p-4 space-y-3`}>
      <p className={`text-sm font-semibold ${c.text}`}>Envoyez le montant via Flouci à :</p>
      <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
        <span className="font-mono text-white text-sm tracking-wider">58 960 645</span>
        <CopyBtn value="58960645" />
      </div>
      <p className="text-xs text-gray-400">Après le transfert, téléchargez la capture d'écran ci-dessous.</p>
    </div>
  );

  if (method === "virement") return (
    <div className={`rounded-xl border ${c.border}/40 ${c.bg} p-4 space-y-3`}>
      <p className={`text-sm font-semibold ${c.text}`}>Effectuez un virement vers :</p>
      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">RIB</p>
          <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
            <span className="font-mono text-white text-sm tracking-wider">24 031 201 5632 512201 69</span>
            <CopyBtn value="24031201563251220169" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Bénéficiaire</p>
          <div className="bg-black/20 rounded-lg px-3 py-2">
            <span className="text-white text-sm font-semibold">Trakioo</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">Après le virement, téléchargez votre justificatif ci-dessous.</p>
    </div>
  );

  return null;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [email, setEmail] = useState(session?.user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("carte");
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<{ code: string; discountPct: number; discount: number; referrerName: string } | null>(null);
  const [steamUsername, setSteamUsername] = useState("");
  const needsSteam = items.some((i) => i.requiresSteamUsername);

  const fileRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)!;

  useEffect(() => {
    // Pre-warm the Flouci initiate route so the first click is never cold
    fetch("/api/payment/flouci/initiate").catch(() => {});

    if (items.length > 0) {
      trackInitiateCheckout(total(), items.reduce((s, i) => s + i.quantity, 0));
      const ids = items.map((i) => i.productId).join(",");
      fetch(`/api/upsells?productIds=${ids}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setUpsells(data); })
        .catch(() => {});
      if (session) {
        fetch("/api/loyalty")
          .then((r) => r.json())
          .then((data) => { if (data.balance > 0) setLoyaltyBalance(data.balance); })
          .catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShoppingCartEmpty />
      </div>
    );
  }

  const subtotal = total();
  const discount = appliedCoupon?.discount ?? 0;
  const referralDiscount = appliedReferral?.discount ?? 0;
  const loyaltyApplied = useLoyalty ? Math.min(loyaltyBalance, Math.max(0, subtotal - discount - referralDiscount)) : 0;
  const finalTotal = Math.max(0, subtotal - discount - referralDiscount - loyaltyApplied);

  function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  }

  async function uploadProof(): Promise<string> {
    if (!proofFile) throw new Error("Aucun justificatif sélectionné.");
    setUploadingProof(true);
    const fd = new FormData();
    fd.append("file", proofFile);
    const res = await fetch("/api/payment/proof", { method: "POST", body: fd });
    setUploadingProof(false);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de l'upload.");
    return data.url;
  }

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
    if (!res.ok) setCouponError(data.error || "Code invalide.");
    else { setAppliedCoupon(data); setCouponInput(""); }
  }

  function removeCoupon() { setAppliedCoupon(null); setCouponError(""); }

  async function applyReferral() {
    if (!referralInput.trim()) return;
    setReferralError("");
    setReferralLoading(true);
    const res = await fetch("/api/referral/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: referralInput.trim(), orderTotal: subtotal - discount }),
    });
    const data = await res.json();
    setReferralLoading(false);
    if (!res.ok) setReferralError(data.error ?? "Code invalide.");
    else {
      setAppliedReferral({ code: referralInput.trim().toUpperCase(), discountPct: data.discountPct, discount: data.discount, referrerName: data.referrerName });
      setReferralInput("");
    }
  }

  function removeReferral() { setAppliedReferral(null); setReferralError(""); }

  async function handlePay() {
    setError("");
    if (!email.includes("@")) { setError("Entrez un email valide."); return; }
    if (needsSteam && !steamUsername.trim()) { setError("Veuillez entrer votre pseudo Steam."); return; }
    if (selectedMethod.needsProof && !proofFile) { setError("Veuillez télécharger le justificatif de paiement."); return; }

    setLoading(true);
    try {
      if (paymentMethod === "carte") {
        const payload = JSON.stringify({
          email,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, ...(i.variantId && { variantId: i.variantId }) })),
          ...(appliedCoupon && { couponCode: appliedCoupon.code }),
          ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
          ...(useLoyalty && loyaltyBalance > 0 && { useLoyalty: true }),
          ...(appliedReferral && { referralCode: appliedReferral.code }),
        });
        const opts: RequestInit = { method: "POST", headers: { "Content-Type": "application/json" }, body: payload };
        // Retry once on network failure (cold-start can drop the first connection)
        let res: Response;
        try {
          res = await fetch("/api/payment/flouci/initiate", opts);
        } catch {
          await new Promise((r) => setTimeout(r, 3000));
          res = await fetch("/api/payment/flouci/initiate", opts);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur de paiement.");
        clearCart();
        window.location.href = data.paymentUrl;
      } else {
        const proofUrl = await uploadProof();
        const res = await fetch("/api/payment/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            paymentMethod,
            paymentProofUrl: proofUrl,
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, ...(i.variantId && { variantId: i.variantId }) })),
            ...(appliedCoupon && { couponCode: appliedCoupon.code }),
            ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
            ...(useLoyalty && loyaltyBalance > 0 && { useLoyalty: true }),
            ...(appliedReferral && { referralCode: appliedReferral.code }),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur lors de la commande.");
        clearCart();
        router.push(`/checkout/en-attente?orderNumber=${data.orderNumber}`);
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/panier" className="hover:text-gray-300 transition-colors">Panier</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-white font-medium">Paiement</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left — form */}
          <div className="lg:col-span-3 space-y-4">

            {/* Step 1 — Email */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="font-semibold text-white text-sm">Coordonnées</h2>
              </div>
              <div className="p-5 space-y-3">
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
                {!session && (
                  <p className="text-xs text-gray-500 bg-gray-800/60 rounded-xl p-3 border border-gray-700/40">
                    💡 Pas de compte requis. Votre clé sera envoyée à cet email après confirmation.
                  </p>
                )}
              </div>
            </div>

            {/* Steam */}
            {needsSteam && (
              <div className="rounded-2xl border border-blue-800/50 bg-blue-900/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-blue-800/30 flex items-center gap-3">
                  <Gamepad2 className="h-4 w-4 text-blue-400" />
                  <h2 className="font-semibold text-white text-sm">Pseudo Steam requis</h2>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-400">Ce produit est offert en cadeau via Steam. Entrez votre pseudo exact pour recevoir le cadeau.</p>
                  <Input placeholder="VotrePseudoSteam" value={steamUsername} onChange={(e) => setSteamUsername(e.target.value)} className="font-mono h-11" />
                </div>
              </div>
            )}

            {/* Step 2 — Coupon */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="font-semibold text-white text-sm">Code promo</h2>
                <span className="text-xs text-gray-600 font-normal">(optionnel)</span>
              </div>
              <div className="p-5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-900/20 border border-green-700/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-900/50 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-300">{appliedCoupon.code}</p>
                        <p className="text-xs text-gray-400">
                          {appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatPrice(appliedCoupon.value)} de réduction
                          {" · "}<span className="text-green-400 font-semibold">-{formatPrice(appliedCoupon.discount)}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      <Input
                        placeholder="Ex : PROMO20"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && applyCode()}
                        className="uppercase placeholder:normal-case h-11 pl-9"
                      />
                    </div>
                    <Button variant="outline" onClick={applyCode} disabled={couponLoading || !couponInput.trim()} className="shrink-0 h-11 px-5">
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                    <X className="h-3 w-3" /> {couponError}
                  </p>
                )}
              </div>
            </div>

            {/* Referral code */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <Gift className="h-4 w-4 text-pink-400" />
                <h2 className="font-semibold text-white text-sm">Code de parrainage</h2>
                <span className="text-xs text-gray-600 font-normal">(optionnel)</span>
              </div>
              <div className="p-5">
                {appliedReferral ? (
                  <div className="flex items-center justify-between rounded-xl bg-pink-900/20 border border-pink-700/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-900/50 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-pink-300">{appliedReferral.code}</p>
                        <p className="text-xs text-gray-400">
                          Parrainé par <span className="text-white font-medium">{appliedReferral.referrerName}</span>
                          {" · "}<span className="text-pink-400 font-semibold">-{appliedReferral.discountPct}% appliqué</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={removeReferral} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex : LOOT8X2K"
                      value={referralInput}
                      onChange={(e) => { setReferralInput(e.target.value.toUpperCase()); setReferralError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && applyReferral()}
                      className="uppercase placeholder:normal-case h-11 font-mono tracking-widest"
                    />
                    <Button variant="outline" onClick={applyReferral} disabled={referralLoading || !referralInput.trim()} className="shrink-0 h-11 px-5">
                      {referralLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                    </Button>
                  </div>
                )}
                {referralError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                    <X className="h-3 w-3" /> {referralError}
                  </p>
                )}
              </div>
            </div>

            {/* Loyalty points */}
            {loyaltyBalance > 0 && (
              <button
                type="button"
                onClick={() => setUseLoyalty((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border transition-all text-left ${
                  useLoyalty
                    ? "border-yellow-500/60 bg-yellow-900/15"
                    : "border-gray-800 bg-gray-900 hover:border-yellow-700/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${useLoyalty ? "bg-yellow-500/20" : "bg-gray-800"}`}>
                    <Gift className={`h-4.5 w-4.5 ${useLoyalty ? "text-yellow-400" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${useLoyalty ? "text-yellow-300" : "text-white"}`}>
                      Points de fidélité
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {useLoyalty
                        ? `−${loyaltyApplied.toFixed(3)} TND appliqués`
                        : `${loyaltyBalance.toFixed(3)} TND disponibles — cliquez pour utiliser`}
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center shrink-0 ${useLoyalty ? "bg-yellow-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${useLoyalty ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            )}

            {/* Step 3 — Payment */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <h2 className="font-semibold text-white text-sm">Mode de paiement</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Method cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_METHODS.map((m) => {
                    const active = paymentMethod === m.id;
                    const c = COLOR_MAP[m.color];
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setPaymentMethod(m.id); setProofFile(null); setProofPreview(null); setError(""); }}
                        className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-150 ${
                          active ? `${c.border} ${c.bg} shadow-sm` : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? c.icon : "text-gray-500 bg-gray-700/50"}`}>
                            {m.icon}
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${active ? c.radio : "border-gray-600 bg-transparent"}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${active ? "text-white" : "text-gray-300"}`}>{m.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual payment details + upload */}
                {selectedMethod.needsProof && (
                  <div className="space-y-3">
                    <ManualPaymentDetails method={paymentMethod} />

                    {/* Upload zone */}
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 p-6 ${
                        proofFile
                          ? "border-green-600/60 bg-green-900/10"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/20 hover:bg-gray-800/40"
                      }`}
                    >
                      {proofPreview ? (
                        <div className="relative w-full max-w-xs mx-auto">
                          <img src={proofPreview} alt="Justificatif" className="rounded-xl max-h-44 w-full object-contain shadow-lg" />
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                            <CheckCircle className="h-3 w-3" /> OK
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-300">Déposez votre justificatif</p>
                            <p className="text-xs text-gray-500 mt-1">ou cliquez pour choisir un fichier</p>
                            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP · max 10 Mo</p>
                          </div>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProofFile} />
                    </div>

                    {proofFile && (
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
                      >
                        <X className="h-3 w-3" /> Supprimer et choisir un autre fichier
                      </button>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 text-sm text-red-300 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* CTA */}
                <Button
                  size="lg"
                  className="w-full gap-2 py-6 text-base rounded-xl shadow-lg shadow-purple-900/30"
                  onClick={handlePay}
                  disabled={loading || uploadingProof || !email.includes("@") || (selectedMethod.needsProof && !proofFile)}
                >
                  {loading || uploadingProof ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />
                      {uploadingProof ? "Upload en cours…" : paymentMethod === "carte" ? "Redirection vers le paiement…" : "Envoi de la commande…"}
                    </>
                  ) : (
                    <><Lock className="h-4 w-4" />
                      {paymentMethod === "carte"
                        ? `Payer ${formatPrice(finalTotal)} — Carte bancaire`
                        : `Confirmer — ${formatPrice(finalTotal)}`}
                    </>
                  )}
                </Button>

                {paymentMethod !== "carte" && (
                  <p className="text-xs text-gray-500 text-center">
                    Votre commande sera activée après vérification du justificatif par notre équipe (1h–24h).
                  </p>
                )}

                {/* Trust row */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  {[
                    { icon: Shield, text: "SSL sécurisé" },
                    { icon: Zap, text: "Livraison 1h–24h" },
                    { icon: Lock, text: "Données chiffrées" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Icon className="h-3.5 w-3.5 text-green-600" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — order summary + upsells */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 space-y-0">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">Votre commande</h3>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3 border-b border-gray-800 max-h-56 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-start gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-gray-800 overflow-hidden shrink-0 border border-gray-700/50">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate leading-snug">{item.name}</p>
                      {item.variantName && <p className="text-[10px] text-gray-500 mt-0.5">{item.variantName}</p>}
                      <p className="text-[10px] text-gray-600 mt-0.5">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">
                      {formatPrice((item.discountPrice ?? item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sous-total</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Livraison</span>
                  <span className="text-green-400 font-semibold">Gratuite</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 flex items-center gap-1.5">
                      <Tag className="h-3 w-3" /> {appliedCoupon?.code}
                    </span>
                    <span className="text-green-400 font-semibold">-{formatPrice(discount)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-pink-400 flex items-center gap-1.5">
                      <Gift className="h-3 w-3" /> Parrainage -{appliedReferral?.discountPct}%
                    </span>
                    <span className="text-pink-400 font-semibold">-{formatPrice(referralDiscount)}</span>
                  </div>
                )}
                {loyaltyApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400 flex items-center gap-1.5">
                      <Gift className="h-3 w-3" /> Points fidélité
                    </span>
                    <span className="text-yellow-400 font-semibold">-{loyaltyApplied.toFixed(3)} TND</span>
                  </div>
                )}

                <div className="border-t border-gray-800 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-white">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Secure note */}
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2.5 border border-gray-700/40">
                  <Shield className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-xs text-gray-400">Paiement 100% sécurisé · Données chiffrées</p>
                </div>
              </div>
            </div>

            {upsells.length > 0 && (
              <UpsellSection products={upsells} variant="checkout" />
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartEmpty() {
  return (
    <>
      <p className="text-gray-400 mb-4">Votre panier est vide.</p>
      <Link href="/produits"><Button>Parcourir le catalogue</Button></Link>
    </>
  );
}
