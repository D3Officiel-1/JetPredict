
'use client';

import { Package, Banknote, CreditCard, ShieldOff, Gavel, FileText, AlertTriangle } from "lucide-react";
import React from "react";

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden transition-all hover:border-primary/30 hover:bg-muted/50">
        <div className="p-4 sm:p-5 flex items-center gap-4 border-b border-border/30 bg-muted/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <div className="p-4 sm:p-6 text-muted-foreground prose prose-sm max-w-none prose-p:leading-relaxed">
            {children}
        </div>
    </div>
);


export default function CGVPage() {
  return (
    <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-primary">Conditions Générales de Vente</h1>
            <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : 01 novembre 2025</p>
        </div>

        <div className="space-y-6">
             <p className="text-center text-muted-foreground max-w-3xl mx-auto">
                Les présentes conditions régissent les ventes d'abonnements aux services de prédiction proposés par Jet Predict. Elles définissent les droits et obligations des parties dans le cadre de la vente en ligne.
            </p>

            <SectionCard icon={<FileText size={20} />} title="Article 1 : Objet">
                <p>Les présentes conditions générales de vente (CGV) s'appliquent, sans restriction ni réserve à l'ensemble des ventes conclues par Jet Predict (« le Vendeur ») auprès de consommateurs et d'acheteurs non professionnels (« Les Clients ou le Client »), désirant acquérir les services proposés à la vente par le Vendeur sur le site Jet Predict (« Les Services »).</p>
            </SectionCard>

            <SectionCard icon={<Package size={20} />} title="Article 2 : Services">
                <p>Les services proposés sont des abonnements donnant accès à des fonctionnalités de prédictions et d'analyses statistiques pour des jeux de hasard. Les différents plans (Semaine, Mensuel, Annuel) sont détaillés sur la page "Forfaits" du site.</p>
            </SectionCard>

            <SectionCard icon={<Banknote size={20} />} title="Article 3 : Tarifs">
                <p>Les Services sont fournis aux tarifs en vigueur figurant sur le site, lors de l'enregistrement de la commande par le Vendeur. Les prix sont exprimés en Francs CFA (FCFA) et Toutes Taxes Comprises (TTC). Ces tarifs sont fermes et non révisables pendant leur période de validité.</p>
            </SectionCard>

            <SectionCard icon={<CreditCard size={20} />} title="Article 4 : Commande et Paiement">
                <p>Le Client sélectionne sur le site le service qu'il désire commander. Le paiement s'effectue via un lien de paiement sécurisé (WhatsApp) dirigé vers un des opérateurs de paiement mobile listés (Wave, Orange Money, etc.).</p>
                <p>Le paiement est exigible immédiatement à la commande. La validation de la commande et l'activation du service sont effectives après confirmation de la réception du paiement par le Vendeur.</p>
            </SectionCard>
            
            <SectionCard icon={<ShieldOff size={20} />} title="Article 5 : Rétractation et Remboursement">
                 <div className="my-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive-foreground/90">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Politique de non-remboursement</h4>
                    <p className="text-foreground/80 dark:text-destructive-foreground/80">
                        Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur.
                    </p>
                     <p className="font-semibold text-foreground/90 dark:text-destructive-foreground mt-3">
                        En souscrivant à nos services, vous acceptez que l'accès soit immédiat et vous renoncez expressément à votre droit de rétractation. Par conséquent, aucun remboursement ne sera effectué une fois le service activé, sauf en cas de défaut de service majeur imputable à Jet Predict.
                    </p>
                </div>
            </SectionCard>

            <SectionCard icon={<Gavel size={20} />} title="Article 6 : Loi Applicable">
                 <p>Les présentes CGV et les opérations qui en découlent sont régies et soumises au droit français. En cas de litige, seul le texte en langue française fera foi.</p>
            </SectionCard>
        </div>
    </div>
  );
}
