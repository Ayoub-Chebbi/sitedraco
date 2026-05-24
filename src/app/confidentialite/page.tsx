import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Notre politique de confidentialité et de protection des données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : janvier 2025</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Données collectées</h2>
          <p>Nous collectons les données suivantes lors de votre inscription et de vos achats : nom, adresse email, et historique de commandes. Aucune donnée bancaire n&apos;est stockée sur nos serveurs — les paiements sont traités par un prestataire sécurisé certifié PCI-DSS.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Utilisation des données</h2>
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Gérer votre compte et vos commandes</li>
            <li>Vous livrer vos produits numériques</li>
            <li>Assurer le support client</li>
            <li>Améliorer nos services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Partage des données</h2>
          <p>Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers à des fins commerciales. Vos données peuvent être transmises à nos prestataires techniques (hébergement, paiement) dans le strict cadre de l&apos;exécution du service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Cookies</h2>
          <p>Notre site utilise des cookies techniques nécessaires au fonctionnement (session, authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Vos droits</h2>
          <p>Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à support@lootstore.tn.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Sécurité</h2>
          <p>Toutes les communications entre votre navigateur et nos serveurs sont chiffrées via HTTPS/TLS. Vos mots de passe sont stockés sous forme hachée et ne sont jamais accessibles en clair.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Contact</h2>
          <p>Pour toute question relative à vos données personnelles : support@lootstore.tn</p>
        </section>
      </div>
    </div>
  );
}
