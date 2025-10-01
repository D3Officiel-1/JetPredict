
export default function CGUPage() {
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-primary">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 01 septembre 2025</p>
        </div>

        <div className="space-y-6 text-muted-foreground">
            <p>
                Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition du site et des services par JetPredict et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur ».
            </p>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 1 : Accès au site</h2>
                <p>
                    L'accès au site et son utilisation sont réservés à un usage strictly personnel. Vous vous engagez à ne pas utiliser ce site et les informations ou données qui y figurent à des fins commerciales, politiques, publicitaires et pour toute forme de sollicitation commerciale.
                </p>
                <p>
                    L'accès aux fonctionnalités de prédiction nécessite la création d'un compte et la souscription à un abonnement payant.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 2 : Contenu du site</h2>
                <p>
                    Toutes les marques, photographies, textes, commentaires, illustrations, images animées ou non, séquences vidéo, sons, ainsi que toutes les applications informatiques qui pourraient être utilisées pour faire fonctionner ce site et plus généralement tous les éléments reproduits ou utilisés sur le site sont protégés par les lois en vigueur au titre de la propriété intellectuelle.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 3 : Gestion du site</h2>
                <p>Pour la bonne gestion du site, l'éditeur pourra à tout moment :</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>suspendre, interrompre ou limiter l'accès à tout ou partie du site, réserver l'accès au site, ou à certaines parties du site, à une catégorie déterminée d'internautes ;</li>
                    <li>supprimer toute information pouvant en perturber le fonctionnement ou entrant en contravention avec les lois nationales ou internationales ;</li>
                    <li>suspendre le site afin de procéder à des mises à jour.</li>
                </ul>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 4 : Responsabilité</h2>
                <p>
                    La responsabilité de l'éditeur ne peut être engagée en cas de défaillance, panne, difficulté ou interruption de fonctionnement, empêchant l'accès au site ou à une de ses fonctionnalités. Le matériel de connexion au site que vous utilisez est sous votre entière responsabilité.
                </p>
                <p className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive-foreground/80">
                    <strong>Important :</strong> JetPredict est un outil d'aide à la décision basé sur des analyses statistiques et ne garantit aucun gain à 100%. L'Utilisateur est seul responsable de ses décisions et des éventuelles pertes financières qui pourraient en résulter. Le jeu comporte des risques : endettement, isolement, dépendance.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 5 : Liens hypertextes</h2>
                <p>
                    La mise en place par les utilisateurs de tous liens hypertextes vers tout ou partie du site est strictly interdite, sauf autorisation préalable et écrite de l'éditeur.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 6 : Loi applicable</h2>
                <p>
                    Les présentes conditions d'utilisation du site sont régies par la loi française et soumises à la compétence des tribunaux du siège social de l'éditeur, sous réserve d'une attribution de compétence spécifique découlant d'un texte de loi ou réglementaire particulier.
                </p>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Article 7 : Contactez-nous</h2>
                <p>
                    Pour toute question, information sur les produits présentés sur le site, ou concernant le site lui-même, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:d3.officiel.2@gmail.com" className="text-primary hover:underline">d3.officiel.2@gmail.com</a>.
                </p>
            </div>
        </div>
    </div>
  );
}
