import Link from "next/link";
import { Clock, Mail, MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CheckoutPendingPage({ searchParams }: { searchParams: Promise<{ orderNumber?: string }> }) {
  const { orderNumber } = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto mb-6">
        <Clock className="h-10 w-10 text-amber-400" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Commande reçue !</h1>
      <p className="text-gray-400 text-sm mb-1">Numéro de commande :</p>
      <p className="text-xl font-mono font-bold text-purple-300 mb-6">{orderNumber}</p>

      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-5 text-sm text-left space-y-3 mb-8">
        <p className="font-semibold text-amber-300 flex items-center gap-2">
          <Clock className="h-4 w-4" /> En attente de vérification
        </p>
        <p className="text-gray-400">
          Notre équipe va vérifier votre justificatif de paiement. Une fois confirmé, votre clé vous sera envoyée par email dans un délai de <strong className="text-white">1h à 24h</strong>.
        </p>
        <p className="text-gray-400">
          Vous pouvez également suivre l&apos;état de votre commande dans votre espace client.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber && (
          <Link href={`/commande/${orderNumber}`}>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Suivre ma commande <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/produits">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Continuer mes achats
          </Button>
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <MessageCircle className="h-4 w-4" />
        Un problème ? <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors">Contactez le support</Link>
      </div>
    </div>
  );
}
