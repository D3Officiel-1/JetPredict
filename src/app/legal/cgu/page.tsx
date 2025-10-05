
'use client';

import { Shield, BookOpen, FileText, Bot, AlertTriangle, Blocks, Link, ShieldCheck, Mail } from "lucide-react";
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

export default function CGUPage() {
  return (
    <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-primary">Conditions Générales d'Utilisation</h1>
            <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : 01 novembre 2025</p>
        </div>

        <div className="space-y-6">
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">
                Les présentes Conditions Générales d'Utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition de l'application et des services par Jet Predict et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur ».
            </p>

            <SectionCard icon={<BookOpen size={20} />} title="Article 1 : Accès au site">
                <p>
                    L'accès au site et son utilisation sont réservés à un usage strictement personnel. Vous vous engagez à ne pas utiliser ce site et les informations ou données qui y figurent à des fins commerciales, politiques, publicitaires et pour toute forme de sollicitation commerciale.
                </p>
                <p>
                    L'accès aux fonctionnalités de prédiction nécessite la création d'un compte et la souscription à un abonnement payant.
                </p>
            </SectionCard>

            <SectionCard icon={<FileText size={20} />} title="Article 2 : Contenu du site">
                <p>
                    Toutes les marques, photographies, textes, commentaires, illustrations, images animées ou non, séquences vidéo, sons, ainsi que toutes les applications informatiques qui pourraient être utilisées pour faire fonctionner ce site et plus généralement tous les éléments reproduits ou utilisés sur le site sont protégés par les lois en vigueur au titre de la propriété intellectuelle.
                </p>
            </SectionCard>

            <SectionCard icon={<Bot size={20} />} title="Article 3 : Gestion du site">
                <p>Pour la bonne gestion du site, l'éditeur pourra à tout moment :</p>
                <ul>
                    <li>Suspendre, interrompre ou limiter l'accès à tout ou partie du site, réserver l'accès au site, ou à certaines parties du site, à une catégorie déterminée d'internautes.</li>
                    <li>Supprimer toute information pouvant en perturber le fonctionnement ou entrant en contravention avec les lois nationales ou internationales.</li>
                    <li>Suspendre le site afin de procéder à des mises à jour.</li>
                </ul>
            </SectionCard>
            
            <SectionCard icon={<AlertTriangle size={20} />} title="Article 4 : Responsabilité">
                <p>
                    La responsabilité de l'éditeur ne peut être engagée en cas de défaillance, panne, difficulté ou interruption de fonctionnement, empêchant l'accès au site ou à une de ses fonctionnalités. Le matériel de connexion au site que vous utilisez est sous votre entière responsabilité.
                </p>
                <div className="my-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive-foreground">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Point Crucial</h4>
                    <p className="text-black dark:text-destructive-foreground/80">
                        Jet Predict est un outil d'aide à la décision basé sur des analyses statistiques et ne garantit aucun gain à 100%. L'Utilisateur est seul responsable de ses décisions et des éventuelles pertes financières qui pourraient en résulter. Le jeu comporte des risques : endettement, isolement, dépendance.
                    </p>
                </div>
            </SectionCard>

            <SectionCard icon={<Link size={20} />} title="Article 5 : Liens hypertextes">
                <p>
                    La mise en place par les utilisateurs de tous liens hypertextes vers tout ou partie du site est strictement interdite, sauf autorisation préalable et écrite de l'éditeur.
                </p>
            </SectionCard>

            <SectionCard icon={<ShieldCheck size={20} />} title="Article 6 : Loi applicable">
                <p>
                    Les présentes conditions d'utilisation du site sont régies par la loi française et soumises à la compétence des tribunaux du siège social de l'éditeur, sous réserve d'une attribution de compétence spécifique découlant d'un texte de loi ou réglementaire particulier.
                </p>
            </SectionCard>

            <SectionCard icon={<Mail size={20} />} title="Article 7 : Contactez-nous">
                <p>
                    Pour toute question, information sur les produits présentés sur le site, ou concernant le site lui-même, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:d3.officiel.2@gmail.com">d3.officiel.2@gmail.com</a>.
                </p>
            </SectionCard>
        </div>
    </div>
  );
}
