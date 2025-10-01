'use client';

import { Building, Server, UserCircle, Shield, Mail, Phone, Globe } from "lucide-react";

const InfoCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-muted/50 p-6 rounded-xl border border-border/50 transition-all hover:border-primary/50 hover:bg-muted">
        <div className="flex items-start gap-4">
            <div className="text-primary mt-1">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
                <div className="text-muted-foreground prose-p:my-1 prose-a:text-primary prose-strong:text-foreground">
                    {children}
                </div>
            </div>
        </div>
    </div>
);


export default function MentionsLegalesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Mentions Légales</h1>
        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 01 septembre 2025</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={<Building size={24} />} title="Éditeur du site">
          <p>
            <strong>Predict Inc.</strong><br/>
            Société fictive pour la démonstration<br/>
            quartier Anani ,Port Bouet, ABidjan
          </p>
        </InfoCard>

        <InfoCard icon={<UserCircle size={24} />} title="Directeur de la publication">
           <p>
                <strong>M. D3 Officiel</strong><br/>
                En qualité de CEO de Predict Inc.
           </p>
        </InfoCard>
        
        <InfoCard icon={<Server size={24} />} title="Hébergement">
           <p>
                <strong>Firebase Hosting (Google)</strong><br/>
                Gordon House, Barrow Street<br/>
                Dublin 4, Irlande<br/>
                <a href="https://firebase.google.com" target="_blank" rel="noopener noreferrer">firebase.google.com</a>
           </p>
        </InfoCard>

        <InfoCard icon={<Shield size={24} />} title="Propriété intellectuelle">
            <p>Tous les droits de reproduction sont réservés. La reproduction de tout ou partie de ce site est formellement interdite sans autorisation.</p>
        </InfoCard>
      </div>

       <InfoCard icon={<Globe size={24} />} title="Limitation de responsabilité">
            <p>JetPredict s'efforce de fournir des informations précises, mais ne peut garantir l'exactitude de toutes les données. Le service est un outil d'aide à la décision et ne garantit aucun gain. Jouez de manière responsable.</p>
      </InfoCard>

      <div className="text-center text-sm text-muted-foreground pt-4">
        Pour toute question, contactez-nous à <a href="mailto:d3.officiel.2@gmail.com" className="text-primary hover:underline">d3.officiel.2@gmail.com</a>.
      </div>
    </div>
  );
}
