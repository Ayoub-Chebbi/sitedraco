"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const paymentId = params.get("payment_id"); // Flouci appends this

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || !paymentId) {
      setError("Paramètres de paiement manquants.");
      setState("error");
      return;
    }

    fetch("/api/payment/flouci/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.orderNumber) {
          setOrderNumber(data.orderNumber);
          setState("success");
        } else {
          setError(data.error ?? "Paiement non confirmé.");
          setState("error");
        }
      })
      .catch(() => {
        setError("Erreur de vérification du paiement.");
        setState("error");
      });
  }, [orderId, paymentId]);

  if (state === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="text-gray-400">Vérification du paiement en cours…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Paiement non confirmé</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <Link href="/checkout">
          <Button variant="outline">Réessayer</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Paiement confirmé !</h2>
      <p className="text-gray-400 text-sm mb-1">Numéro de commande :</p>
      <p className="text-xl font-mono font-bold text-purple-300 mb-4">{orderNumber}</p>
      <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
        Votre clé de jeu sera livrée par email et dans votre espace client sous{" "}
        <strong className="text-white">15 à 60 minutes</strong>.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/commande/${orderNumber}`}>
          <Button size="lg" className="gap-2">
            Suivre ma commande <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/produits">
          <Button size="lg" variant="outline">Continuer mes achats</Button>
        </Link>
      </div>
    </div>
  );
}
