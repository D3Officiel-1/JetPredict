
export default function ConfidentialitePage() {
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary">Politique de Confidentialité</h1>
            <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 01 novembre 2025</p>
        </div>

        <div className="space-y-6 text-muted-foreground">
            <p>
                Predict Inc. ("nous", "notre" ou "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre site web Jet Predict (le "Service").
            </p>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">1. Collecte des informations</h2>
                <p>Nous collectons les informations que vous nous fournissez directement lors de votre inscription :</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>Informations d'identification :</strong> nom d'utilisateur, adresse e-mail, mot de passe.</li>
                    <li><strong>Informations de paiement :</strong> Nous ne stockons pas directement vos informations de paiement. Elles sont traitées par nos partenaires de paiement mobile.</li>
                    <li><strong>Données d'utilisation :</strong> L'historique des données de jeu que vous saisissez pour analyse.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">2. Utilisation des informations</h2>
                <p>Nous utilisons les informations collectées pour :</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Fournir, exploiter et maintenir notre Service.</li>
                    <li>Améliorer, personnaliser et développer notre Service.</li>
                    <li>Comprendre et analyser la manière dont vous utilisez notre Service.</li>
                    <li>Gérer votre compte et vous fournir le support client.</li>
                    <li>Vous envoyer des e-mails transactionnels (confirmation de paiement, etc.).</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">3. Partage des informations</h2>
                <p>Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager des informations avec des fournisseurs de services tiers qui nous aident à exploiter notre site web (par exemple, l'hébergement, l'analyse de données), mais ils sont tenus de maintenir la confidentialité de vos informations.</p>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">4. Sécurité des données</h2>
                <p>Nous mettons en œuvre une variété de mesures de sécurité pour maintenir la sécurité de vos informations personnelles. Votre compte est protégé par un mot de passe et nous utilisons le cryptage pour protéger les informations sensibles transmises en ligne.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
                <p>Nous utilisons des cookies pour :</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Comprendre et sauvegarder les préférences de l'utilisateur pour les futures visites.</li>
                    <li>Assurer le bon fonctionnement des sessions utilisateur.</li>
                </ul>
                <p>Vous pouvez choisir de désactiver les cookies via les options de votre navigateur.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">6. Vos droits</h2>
                <p>Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles. Vous pouvez exercer ces droits en nous contactant à l'adresse <a href="mailto:d3.officiel.2@gmail.com" className="text-primary hover:underline">d3.officiel.2@gmail.com</a>.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">7. Modifications de cette politique</h2>
                <p>Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous notifierons de tout changement en publiant la nouvelle politique sur cette page. Nous vous conseillons de consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.</p>
            </div>
        </div>
    </div>
  );
}
