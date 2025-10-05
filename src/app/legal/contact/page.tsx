
'use client';

import { Phone, Mail } from "lucide-react";

const InfoCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden transition-all hover:border-primary/30 hover:bg-muted/50">
        <div className="p-4 sm:p-5 flex items-center gap-4 border-b border-border/30 bg-muted/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-4 sm:p-6 text-muted-foreground prose prose-sm max-w-none prose-p:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-semibold hover:prose-a:underline prose-strong:text-foreground">
            {children}
        </div>
    </div>
);

const WhatsAppIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M16.75 13.96c.25.13.41.2.46.3.05.1.03.48-.02.73-.05.25-.33.48-.58.53-.25.05-1.73.28-3.38-1.38-1.65-1.65-2.73-3.03-2.73-3.03s-.12-.14-.25-.28c-.13-.13-.28-.25-.28-.25s-.1-.08-.14-.13c-.04-.05-.08-.1-.13-.14-.23-.2-.48-.43-.48-.73s.1-.45.2-.58c.1-.13.2-.18.3-.2.1-.03.2-.02.3-.02h.3s.28,0,.48.2c.2.2.5.58.5.58s.18.2.28.3c.1.1.18.23.28.35.1.13.14.18.2.23.05.05.1.1.14.1s.18-.02.28-.1c.1-.08.58-.5.58-.5s.2-.23.3-.34c.1-.1.18-.2.23-.2.05-.02.13,0,.23.04.1.04.58.28.58.28s.25.13.3.18c.05.05.08.1.08.14s-.02.18-.08.28c-.05.1-.13.18-.13.18zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
);

export default function ContactPage() {
  return (
    <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-primary">Contact & Service Client</h1>
            <p className="text-sm text-muted-foreground mt-2">Dernière mise à jour : 01 novembre 2025</p>
        </div>

        <div className="space-y-6">
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">Pour toute question, réclamation ou demande d'information, n'hésitez pas à nous contacter. Notre équipe est à votre disposition pour vous aider.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard icon={<Mail size={20} />} title="Par Email">
                <p>Le moyen le plus efficace de nous joindre. Nous répondons sous 24h.</p>
                <p><a href="mailto:d3.officiel.2@gmail.com">d3.officiel.2@gmail.com</a></p>
            </InfoCard>

            <InfoCard icon={<Phone size={20} />} title="Par Téléphone">
                <p>Pour les demandes urgentes, du lundi au vendredi, de 9h à 17h.</p>
                <p><a href="tel:+2250546511723">+225 05 46 51 17 23</a></p>
            </InfoCard>
            
            <InfoCard icon={<WhatsAppIcon />} title="Par WhatsApp">
                <p>Pour une assistance rapide et directe, contactez-nous sur WhatsApp.</p>
                <p><a href="https://wa.me/2250546511723" target="_blank" rel="noopener noreferrer">Discuter maintenant</a></p>
            </InfoCard>
            
            <InfoCard icon={<WhatsAppIcon />} title="Notre Chaîne WhatsApp">
                <p>Rejoignez notre chaîne pour les dernières actualités et mises à jour.</p>
                <p><a href="https://www.whatsapp.com/channel/0029VbBc22V4yltHAKWD0R2x" target="_blank" rel="noopener noreferrer">Rejoindre la chaîne</a></p>
            </InfoCard>
        </div>
        
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-foreground text-center">Procédure de Réclamation</h2>
                <div className="mt-4 bg-muted/30 p-6 rounded-xl border border-border/30 prose prose-sm max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline">
                    <p className="text-muted-foreground mb-4">Si vous avez une réclamation concernant nos services, veuillez nous l'adresser par email à <a href="mailto:d3.officiel.2@gmail.com">d3.officiel.2@gmail.com</a> en incluant les informations suivantes :</p>
                    <ul className="list-disc list-inside space-y-2 pl-4 text-muted-foreground">
                        <li>Votre nom d'utilisateur et votre adresse email.</li>
                        <li>Une description détaillée de l'objet de votre réclamation.</li>
                        <li>Toute documentation ou capture d'écran pouvant appuyer votre demande.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">Nous accuserons réception de votre réclamation sous 48 heures et nous nous engageons à vous apporter une réponse complète dans les plus brefs délais.</p>
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold text-foreground text-center">Adresse Postale</h2>
                 <div className="mt-4 bg-muted/30 p-6 rounded-xl border border-border/30">
                    <p className="text-muted-foreground">Pour tout courrier officiel, vous pouvez nous écrire à l'adresse de notre siège social :</p>
                    <p className="font-semibold text-foreground mt-2">
                        <strong>Predict Inc.</strong><br />
                        quartier Anani ,Port Bouet, ABidjan
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
