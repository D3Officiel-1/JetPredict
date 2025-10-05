
'use client';

import { Building, Server, UserCircle, Shield, Mail, Phone, Globe } from "lucide-react";
import { motion } from "framer-motion";

const InfoRow = ({ icon, title, children, delay }: { icon: React.ReactNode, title: string, children: React.ReactNode, delay: number }) => (
    <motion.div
        className="flex flex-col sm:flex-row gap-4 py-6 border-b border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
    >
        <div className="flex items-center gap-4 shrink-0 sm:w-1/3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                {icon}
            </div>
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        </div>
        <div className="text-muted-foreground prose-p:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline prose-strong:text-foreground">
            {children}
        </div>
    </motion.div>
);


export default function MentionsLegalesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Mentions Légales</h1>
        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 01 novembre 2025</p>
      </div>
      
      <div className="flex flex-col">
        <InfoRow icon={<Building size={24} />} title="Éditeur du site" delay={0.1}>
          <p>
            <strong>Predict Inc.</strong><br/>
            Société fictive pour la démonstration<br/>
            quartier Anani, Port Bouet, Abidjan
          </p>
        </InfoRow>

        <InfoRow icon={<UserCircle size={24} />} title="Directeur de la publication" delay={0.2}>
           <p>
                <strong>M. D3 Officiel</strong><br/>
                En qualité de CEO de Predict Inc.
           </p>
        </InfoRow>
        
        <InfoRow icon={<Server size={24} />} title="Hébergement" delay={0.3}>
           <p>
                <strong>Vercel Inc.</strong><br/>
                340 S Lemon Ave #4133, Walnut, CA 91789<br/>
                Déployé via GitHub.<br/>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
           </p>
        </InfoRow>

        <InfoRow icon={<Shield size={24} />} title="Propriété intellectuelle" delay={0.4}>
            <p>Tous les droits de reproduction sont réservés. La reproduction de tout ou partie de ce site est formellement interdite sans autorisation écrite préalable de l'éditeur.</p>
        </InfoRow>
        
        <InfoRow icon={<Globe size={24} />} title="Limitation de responsabilité" delay={0.5}>
            <p>JetPredict est un outil d'aide à la décision basé sur des analyses statistiques et ne garantit aucun gain. Le jeu comporte des risques. Jouez toujours de manière responsable et fixez-vous des limites.</p>
      </InfoRow>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/50 prose prose-sm prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline">
        Pour toute question, contactez-nous à <a href="mailto:d3.officiel.2@gmail.com">d3.officiel.2@gmail.com</a>.
      </div>
    </div>
  );
}
