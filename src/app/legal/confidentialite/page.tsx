
'use client';

import { Shield, Database, Cog, Share2, Lock, Cookie, UserCheck, RefreshCw, Mail } from "lucide-react";
import React from "react";

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden transition-all hover:border-primary/30 hover:bg-muted/50">
        <div className="p-4 sm:p-5 flex items-center gap-4 border-b border-border/30 bg-muted/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <div className="p-4 sm:p-6 text-muted-foreground prose prose-sm max-w-none prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline">
            {children}
        </div>
    </div>
);

export default function ConfidentialitePage() {
  return (
    <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-primary">Politique de Confidentialité</h1>
            <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : 01 novembre 2025</p>
        </div>

        <div className="space-y-6">
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">
                Predict Inc. ("nous", "notre" ou "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre site web Jet Predict (le "Service").
            </p>

            <SectionCard icon={<Database size={20} />} title="1. Collecte des informations">
                <p>Nous collectons les informations que vous nous fournissez directement lors de votre inscription :</p>
                <ul>
                    <li><strong>Informations d'identification :</strong> nom d'utilisateur, adresse e-mail, mot de passe.</li>
                    <li><strong>Informations de paiement :</strong> Nous ne stockons pas directement vos informations de paiement. Elles sont traitées par nos partenaires de paiement mobile.</li>
                    <li><strong>Données d'utilisation :</strong> L'historique des données de jeu que vous saisissez pour analyse.</li>
                </ul>
            </SectionCard>

            <SectionCard icon={<Cog size={20} />} title="2. Utilisation des informations">
                 <p>Nous utilisons les informations collectées pour :</p>
                <ul>
                    <li>Fournir, exploiter et maintenir notre Service.</li>
                    <li>Améliorer, personnaliser et développer notre Service.</li>
                    <li>Comprendre et analyser la manière dont vous utilisez notre Service.</li>
                    <li>Gérer votre compte et vous fournir le support client.</li>
                    <li>Vous envoyer des e-mails transactionnels (confirmation de paiement, etc.).</li>
                </ul>
            </SectionCard>

            <SectionCard icon={<Share2 size={20} />} title="3. Partage des informations">
                <p>Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager des informations avec des fournisseurs de services tiers qui nous aident à exploiter notre site web (par exemple, l'hébergement, l'analyse de données), mais ils sont tenus de maintenir la confidentialité de vos informations.</p>
            </SectionCard>
            
            <SectionCard icon={<Lock size={20} />} title="4. Sécurité des données">
                 <p>Nous mettons en œuvre une variété de mesures de sécurité pour maintenir la sécurité de vos informations personnelles. Votre compte est protégé par un mot de passe et nous utilisons le cryptage pour protéger les informations sensibles transmises en ligne.</p>
            </SectionCard>

            <SectionCard icon={<Cookie size={20} />} title="5. Cookies">
                <p>Nous utilisons des cookies pour :</p>
                <ul>
                    <li>Comprendre et sauvegarder les préférences de l'utilisateur pour les futures visites.</li>
                    <li>Assurer le bon fonctionnement des sessions utilisateur.</li>
                </ul>
                <p>Vous pouvez choisir de désactiver les cookies via les options de votre navigateur.</p>
            </SectionCard>

            <SectionCard icon={<UserCheck size={20} />} title="6. Vos droits">
                <p>Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles. Vous pouvez exercer ces droits en nous contactant à l'adresse <a href="mailto:d3.officiel.2@gmail.com">d3.officiel.2@gmail.com</a>.</p>
            </SectionCard>

            <SectionCard icon={<RefreshCw size={20} />} title="7. Modifications de cette politique">
                <p>Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous notifierons de tout changement en publiant la nouvelle politique sur cette page. Nous vous conseillons de consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.</p>
            </SectionCard>
        </div>
    </div>
  );
}
