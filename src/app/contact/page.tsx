import { Metadata } from "next";
import { MessageCircle, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Nous contacter",
  description: "Contactez notre support client disponible 7j/7.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Nous contacter</h1>
        <p className="text-gray-400">Notre équipe vous répond rapidement</p>
      </div>

      <div className="grid gap-4 mb-8">
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? "21600000000"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-green-700/50 transition-colors group"
        >
          <div className="p-3 rounded-lg bg-green-600/10 group-hover:bg-green-600/20 transition-colors">
            <MessageCircle className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white">WhatsApp</p>
            <p className="text-sm text-gray-400">Réponse en moins de 30 minutes</p>
            <p className="text-sm text-green-400 mt-0.5">+{process.env.NEXT_PUBLIC_WHATSAPP ?? "21600000000"}</p>
          </div>
        </a>

        <a
          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@loot.tn"}`}
          className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-purple-700/50 transition-colors group"
        >
          <div className="p-3 rounded-lg bg-purple-600/10 group-hover:bg-purple-600/20 transition-colors">
            <Mail className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Email</p>
            <p className="text-sm text-gray-400">Réponse sous 24h</p>
            <p className="text-sm text-purple-400 mt-0.5">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@loot.tn"}</p>
          </div>
        </a>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 flex items-center gap-3">
        <Clock className="h-5 w-5 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-400">
          Support disponible <span className="text-white font-medium">7j/7 de 9h à 22h</span>.
          Pour les urgences, privilégiez WhatsApp.
        </p>
      </div>
    </div>
  );
}
