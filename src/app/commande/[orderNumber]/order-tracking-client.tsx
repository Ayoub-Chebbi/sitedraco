"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, Package, Key, Copy, CheckCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice, formatDate } from "@/lib/utils";

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: { id: string; name: string; platform: string; imageUrl: string | null };
    key: { value: string } | null;
  }[];
};

const STEPS = [
  { key: "pending", label: "Commande reçue", icon: <Package className="h-4 w-4" />, desc: "Votre commande a bien été enregistrée" },
  { key: "processing", label: "Paiement vérifié", icon: <CheckCircle className="h-4 w-4" />, desc: "Notre équipe prépare votre clé" },
  { key: "delivered", label: "Clé livrée", icon: <Key className="h-4 w-4" />, desc: "Votre clé est disponible ci-dessous" },
];

function getStepIndex(status: string) {
  if (status === "delivered") return 2;
  if (status === "processing") return 1;
  return 0;
}

export function OrderTrackingClient({ order }: { order: OrderData }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const currentStep = getStepIndex(order.status);
  const isFailed = order.status === "failed" || order.status === "refund_initiated" || order.status === "refunded";

  function copyKey(value: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(value);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-gray-500 text-sm">Commande</p>
        <h1 className="text-2xl font-bold text-white font-mono">{order.orderNumber}</h1>
        <p className="text-sm text-gray-500 mt-1">Passée le {formatDate(order.createdAt)}</p>
      </div>

      {/* Status timeline */}
      {!isFailed ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-800" />
            <div className="space-y-6">
              {STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step.key} className="relative flex gap-4 items-start">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      done ? "bg-green-600" : "bg-gray-800"
                    }`}>
                      {done ? <CheckCircle className="h-4 w-4 text-white" /> : step.icon}
                    </div>
                    <div className="pt-1 flex-1">
                      <p className={`font-semibold text-sm ${done ? "text-white" : "text-gray-600"}`}>
                        {step.label}
                        {active && order.status !== "delivered" && (
                          <span className="ml-2 text-xs text-purple-400 font-normal animate-pulse">En cours...</span>
                        )}
                      </p>
                      {done && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-5 mb-6">
          <p className="text-red-400 font-semibold">Commande échouée</p>
          <p className="text-sm text-gray-400 mt-1">
            Cette commande n&apos;a pas pu être traitée. Contactez notre support pour plus d&apos;informations.
          </p>
          <a href="https://wa.me/21600000000" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4 text-green-400" />
              Contacter le support
            </Button>
          </a>
        </div>
      )}

      {/* Delivery time notice */}
      {order.status === "processing" && (
        <div className="rounded-xl border border-purple-800/30 bg-purple-900/10 p-4 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-purple-400 shrink-0" />
          <p className="text-sm text-gray-300">
            Livraison estimée : <strong className="text-white">15 à 60 minutes</strong>. Vous recevrez un email dès que votre clé sera prête.
          </p>
        </div>
      )}

      {/* Products & keys */}
      <div className="space-y-4 mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex gap-3 items-start mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl shrink-0">
                🎮
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <PlatformBadge platform={item.product.platform} />
                </div>
                <p className="font-semibold text-white text-sm">{item.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Qté : {item.quantity} · {formatPrice(item.unitPrice)} / unité</p>
              </div>
            </div>

            {item.key && order.status === "delivered" && (
              <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-700/40">
                <p className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Votre clé d&apos;activation
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm text-white bg-gray-900 rounded px-3 py-2 select-all border border-gray-700">
                    {item.key.value}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyKey(item.key!.value)}
                    className="shrink-0 gap-1"
                  >
                    {copiedKey === item.key.value ? (
                      <><CheckCheck className="h-3 w-3 text-green-400" /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copier</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {order.status !== "delivered" && (
              <div className="mt-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Clé disponible après livraison</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Méthode de paiement</span>
          <span className="text-gray-300 capitalize">{order.paymentMethod}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-white">Total payé</span>
          <span className="text-white">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/produits">
          <Button variant="outline" className="w-full sm:w-auto">Continuer mes achats</Button>
        </Link>
        <a href="https://wa.me/21600000000" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" className="w-full sm:w-auto gap-2">
            <MessageCircle className="h-4 w-4 text-green-400" />
            Besoin d&apos;aide ?
          </Button>
        </a>
      </div>
    </div>
  );
}
