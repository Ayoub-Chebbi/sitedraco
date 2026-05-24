import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente de notre boutique de jeux numériques.",
};

export default function CgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Conditions générales de vente</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : janvier 2025</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Objet</h2>
          <p>Les présentes conditions générales de vente régissent les ventes de produits numériques (clés de jeux, cartes prépayées, abonnements) effectuées sur notre boutique en ligne. Tout achat implique l&apos;acceptation sans réserve des présentes conditions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Produits</h2>
          <p>Nos produits sont des biens numériques dématérialisés : clés d&apos;activation, codes de téléchargement, cartes prépayées et abonnements gaming. Ils sont destinés à un usage personnel et non commercial.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Prix et paiement</h2>
          <p>Les prix sont affichés en Dinars Tunisiens (TND) toutes taxes comprises. Le paiement s&apos;effectue en ligne par carte bancaire (Visa, Mastercard) via une plateforme sécurisée. La commande est confirmée après validation du paiement.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Livraison</h2>
          <p>Les produits numériques sont livrés immédiatement après confirmation du paiement, directement dans l&apos;espace client de l&apos;acheteur. Un email de confirmation est également envoyé. Le délai de livraison est généralement compris entre 1 et 60 minutes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Droit de rétractation</h2>
          <p>Conformément à la nature des biens numériques, le droit de rétractation ne s&apos;applique pas dès lors que la clé ou le code a été révélé à l&apos;acheteur. En cas de clé invalide ou non fonctionnelle, notre service après-vente procède au remplacement ou au remboursement.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Garantie et remboursement</h2>
          <p>Nous garantissons que toutes les clés vendues sont valides au moment de la livraison. En cas de problème avéré (clé déjà utilisée, région incompatible non mentionnée), nous procédons au remplacement dans les meilleurs délais ou au remboursement intégral.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Responsabilité</h2>
          <p>Nous déclinons toute responsabilité en cas d&apos;utilisation frauduleuse ou non conforme de nos produits. L&apos;acheteur est responsable de la compatibilité du produit avec sa région et sa plateforme.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
          <p>Pour toute question relative à une commande, contactez notre service client via WhatsApp ou par email à support@lootstore.tn.</p>
        </section>
      </div>
    </div>
  );
}
