import { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Clock, TicketCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Nous contacter",
  description: "Contactez notre support client disponible 7j/7.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Nous contacter</h1>
        <p className="text-gray-400">Notre équipe vous répond rapidement via notre système de tickets</p>
      </div>

      <div className="grid gap-4 mb-8">
        <Link
          href="/dashboard/support/nouveau"
          className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-purple-700/50 transition-colors group"
        >
          <div className="p-3 rounded-lg bg-purple-600/10 group-hover:bg-purple-600/20 transition-colors">
            <TicketCheck className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Ouvrir un ticket de support</p>
            <p className="text-sm text-gray-400">Réponse garantie sous 24h</p>
            <p className="text-sm text-purple-400 mt-0.5">Connectez-vous pour créer un ticket</p>
          </div>
        </Link>

        <Link
          href="/dashboard/support"
          className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-purple-700/50 transition-colors group"
        >
          <div className="p-3 rounded-lg bg-purple-600/10 group-hover:bg-purple-600/20 transition-colors">
            <MessageCircle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Mes tickets</p>
            <p className="text-sm text-gray-400">Suivez vos demandes en cours</p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 flex items-center gap-3">
        <Clock className="h-5 w-5 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-400">
          Support disponible <span className="text-white font-medium">7j/7 de 9h à 22h</span>.
          Nous traitons chaque ticket dans les meilleurs délais.
        </p>
      </div>
    </div>
  );
}
