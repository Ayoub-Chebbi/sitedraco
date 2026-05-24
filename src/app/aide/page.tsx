import { Metadata } from "next";
import { Zap, CreditCard, Mail, ShieldCheck, Clock, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Découvrez comment acheter vos jeux numériques et cartes prépayées en toute sécurité.",
};

const steps = [
  {
    icon: <HelpCircle className="h-6 w-6 text-purple-400" />,
    title: "1. Choisissez votre produit",
    desc: "Parcourez notre catalogue de jeux numériques, cartes prépayées et abonnements gaming. Filtrez par plateforme ou catégorie.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-purple-400" />,
    title: "2. Payez en toute sécurité",
    desc: "Réglez par carte bancaire (Visa, Mastercard). Votre paiement est chiffré et sécurisé.",
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-400" />,
    title: "3. Recevez votre clé",
    desc: "Votre clé ou code d'activation est envoyé immédiatement après confirmation du paiement, directement dans votre espace client.",
  },
  {
    icon: <Mail className="h-6 w-6 text-purple-400" />,
    title: "4. Activez et profitez",
    desc: "Entrez la clé sur la plateforme correspondante (Steam, PlayStation Store, Xbox, etc.) et profitez de votre jeu.",
  },
];

const faqs = [
  {
    q: "Combien de temps faut-il pour recevoir ma clé ?",
    a: "La livraison est quasi-instantanée après confirmation du paiement, généralement entre 1 et 15 minutes.",
  },
  {
    q: "Que faire si ma clé ne fonctionne pas ?",
    a: "Contactez notre support via WhatsApp ou ouvrez un ticket dans votre espace client. Nous résolvons chaque problème sous 24h.",
  },
  {
    q: "Les produits sont-ils originaux ?",
    a: "Oui, tous nos produits sont 100% officiels, achetés auprès de distributeurs agréés.",
  },
  {
    q: "Puis-je obtenir un remboursement ?",
    a: "Si votre clé est invalide et que nous ne pouvons pas en fournir une autre, vous serez intégralement remboursé.",
  },
];

export default function AidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">Comment ça marche ?</h1>
        <p className="text-gray-400">Achetez vos jeux numériques en 4 étapes simples</p>
      </div>

      <div className="grid gap-6 mb-14">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mt-0.5 p-2 rounded-lg bg-purple-600/10 h-fit">{s.icon}</div>
            <div>
              <h2 className="font-semibold text-white mb-1">{s.title}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-green-400" />
          <h2 className="font-semibold text-white">Nos garanties</h2>
        </div>
        <ul className="space-y-3 text-sm text-gray-400">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />Clés 100% officielles et garanties valides</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />Paiement sécurisé par cryptage SSL</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />Support disponible 7j/7 de 9h à 22h</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />Remboursement si clé invalide non remplacée</li>
        </ul>
      </div>

      <div>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-400" /> Questions fréquentes
        </h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="font-medium text-white text-sm mb-2">{f.q}</p>
              <p className="text-sm text-gray-400">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
