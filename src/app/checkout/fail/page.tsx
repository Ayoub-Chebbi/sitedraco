"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <XCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Paiement échoué</h2>
      <p className="text-gray-400 text-sm mb-8">
        Votre paiement n'a pas pu être traité. Aucun montant n'a été débité. Vous pouvez réessayer.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/checkout">
          <Button size="lg">Réessayer</Button>
        </Link>
        <Link href="/panier">
          <Button size="lg" variant="outline">Retour au panier</Button>
        </Link>
      </div>
    </div>
  );
}
