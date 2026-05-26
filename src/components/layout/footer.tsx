import Link from "next/link";
import { MessageCircle, Clock, Shield, Zap, RefreshCw } from "lucide-react";

export function Footer({ siteName = "Loot", logoUrl = "" }: { siteName?: string; logoUrl?: string }) {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-16">
      {/* Trust bar */}
      <div className="border-b border-gray-800/50 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Zap className="h-5 w-5 text-purple-400" />, title: "Livraison rapide", desc: "Clé reçue en 1 à 6h" },
            { icon: <Shield className="h-5 w-5 text-purple-400" />, title: "Paiement sécurisé", desc: "Transactions chiffrées" },
            { icon: <MessageCircle className="h-5 w-5 text-purple-400" />, title: "Support réactif", desc: "Disponible 7j/7" },
            { icon: <RefreshCw className="h-5 w-5 text-purple-400" />, title: "Satisfaction garantie", desc: "Remboursement si problème" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/10 shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                siteName.charAt(0)
              )}
            </div>
            <span className="font-bold text-xl text-white">{siteName}</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Votre boutique de confiance pour les jeux numériques, cartes prépayées et abonnements gaming.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Link href="/contact" className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <MessageCircle className="h-4 w-4" />
              Support tickets
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Plateformes</h4>
          <ul className="space-y-2">
            {["PS4 / PS5", "Xbox", "Steam", "Nintendo", "Mobile"].map((p) => (
              <li key={p}>
                <Link href={`/produits?platform=${p.toLowerCase().split(" ")[0]}`}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  {p}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Mon compte</h4>
          <ul className="space-y-2">
            {[
              { label: "Mes commandes", href: "/dashboard/commandes" },
              { label: "Mes clés reçues", href: "/dashboard/cles" },
              { label: "Mon profil", href: "/dashboard/profil" },
              { label: "Support", href: "/dashboard/support" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Informations</h4>
          <ul className="space-y-2">
            {[
              { label: "Comment ça marche", href: "/aide" },
              { label: "Conditions générales", href: "/cgv" },
              { label: "Politique de confidentialité", href: "/confidentialite" },
              { label: "Nous contacter", href: "/contact" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>Support : 9h–22h, 7j/7</span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Paiement accepté</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-md font-medium whitespace-nowrap">💳 Carte bancaire</span>
              <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-md font-medium whitespace-nowrap">Visa</span>
              <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-md font-medium whitespace-nowrap">Mastercard</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <p className="text-center text-xs text-gray-600">
          © {new Date().getFullYear()} {siteName} — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
