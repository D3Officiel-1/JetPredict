
export default function CGVPage() {
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary">Conditions Générales de Vente (CGV)</h1>
            <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 01 septembre 2025</p>
        </div>

        <div className="space-y-6 text-muted-foreground">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 1 - Objet</h2>
                <p>Les présentes conditions générales de vente (CGV) s'appliquent, sans restriction ni réserve à l'ensemble des ventes conclues par Jet Predict (« le Vendeur ») auprès de consommateurs et d'acheteurs non professionnels (« Les Clients ou le Client »), désirant acquérir les services proposés à la vente par le Vendeur sur le site Jet Predict (« Les Services »).</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 2 - Services</h2>
                <p>Les services proposés sont des abonnements donnant accès à des fonctionnalités de prédictions et d'analyses statistiques pour des jeux de hasard. Les différents plans (Semaine, Mensuel, Annuel) sont détaillés sur la page "Forfaits" du site.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 3 - Tarifs</h2>
                <p>Les Services sont fournis aux tarifs en vigueur figurant sur le site, lors de l'enregistrement de la commande par le Vendeur. Les prix sont exprimés en Francs CFA (FCFA) et Toutes Taxes Comprises (TTC). Ces tarifs sont fermes et non révisables pendant leur période de validité.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 4 - Commandes et Modalités de paiement</h2>
                <p>Le Client sélectionne sur le site le service qu'il désire commander. Le paiement s'effectue via un lien de paiement sécurisé (WhatsApp) dirigé vers un des opérateurs de paiement mobile listés (Wave, Orange Money, etc.).</p>
                <p>Le paiement est exigible immédiatement à la commande. La validation de la commande et l'activation du service sont effectives après confirmation de la réception du paiement par le Vendeur.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 5 - Droit de rétractation et Remboursement</h2>
                <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.</p>
                <p>En souscrivant à nos services, vous acceptez que l'accès au service soit immédiat et vous renoncez expressément à votre droit de rétractation. Par conséquent, aucun remboursement ne sera effectué une fois le service activé, sauf en cas de défaut de service majeur imputable à Jet Predict.</p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 6 - Responsabilité du Vendeur - Garanties</h2>
                <p>Le Vendeur s'engage à fournir un service fonctionnel. Il s'agit d'une obligation de moyens et non de résultat. La nature même du service (aide à la décision pour jeux de hasard) implique une part d'aléa et ne garantit aucun gain. Le Vendeur ne pourra être tenu responsable des pertes financières du Client.</p>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 7 - Droit applicable - Langue</h2>
                <p>Les présentes CGV et les opérations qui en découlent sont régies et soumises au droit français. Les présentes CGV sont rédigées en langue française. Dans le cas où elles seraient traduites en une ou plusieurs langues étrangères, seul le texte français ferait foi en cas de litige.</p>
            </div>
        </div>
    </div>
  );
}
