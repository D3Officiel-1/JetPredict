

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, BarChart, ChevronRight, Zap, BrainCircuit, Award, Quote, Users, TrendingUp, PlayCircle, CheckCircle, MoveUpRight, Globe, Loader2, Star, XCircle, ShieldCheck, Crown, Download, HelpCircle, MoreVertical, Share, MonitorDown, Share2, MoreHorizontal, AppWindow, Smartphone } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { PlanId, PricingConfig } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PricingSection } from "@/components/pricing-section";


const features = [
    {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Prédictions en Temps Réel",
        description: "Obtenez des cotes suggérées instantanément en fonction du niveau de risque que vous choisissez pour les jeux de crash et les paris sportifs.",
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "Fiabilité par l'IA",
        description: "Notre IA analyse des milliers de points de données pour vous donner un indice de confiance fiable, vous aidant à prendre des décisions éclairées.",
    },
    {
        icon: <Award className="h-8 w-8 text-primary" />,
        title: "Stratégies Gagnantes",
        description: "Accédez à des stratégies de paris adaptées, que vous soyez prudent ou audacieux, pour les jeux comme Lucky Jet ou les matchs de football.",
    },
];

const testimonials = [
    {
        name: "Moussa K.",
        role: "Utilisateur VIP",
        rating: 5,
        quote: "JetPredict a changé ma façon de parier. Les prédictions pour les matchs de foot sont incroyablement précises. L'indice de fiabilité est un vrai plus !",
    },
    {
        name: "Awa T.",
        role: "Utilisatrice VVIP",
        rating: 5,
        quote: "Enfin une application qui tient ses promesses pour les paris. L'interface est simple et les résultats parlent d'eux-mêmes. Je recommande à 100%.",
    },
];

const stats = [
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        value: "3,500+",
        label: "Utilisateurs satisfaits"
    },
    {
        icon: <TrendingUp className="h-8 w-8 text-primary" />,
        value: "100,000+",
        label: "Prédictions générées"
    },
    {
        icon: <Award className="h-8 w-8 text-primary" />,
        value: "98%",
        label: "Fiabilité moyenne"
    }
];



const faqItems = [
    {
        question: "Qu'est-ce que JetPredict exactement ?",
        answer: "JetPredict est un outil d'aide à la décision pour les paris sportifs et les jeux de crash. Il utilise des modèles statistiques et une IA pour analyser les tendances et vous fournir des cotes de retrait suggérées afin de vous aider à prendre des décisions plus éclairées et à augmenter vos chances de gains."
    },
    {
        question: "Les prédictions sont-elles garanties à 100% ?",
        answer: "Non. JetPredict est un outil statistique puissant conçu pour vous donner un avantage en identifiant des tendances probables. Cependant, comme pour tout jeu de hasard, le risque zéro n'existe pas. Jouez toujours de manière responsable."
    },
    {
        question: "Comment fonctionne l'abonnement ?",
        answer: "Après votre inscription, vous choisissez un forfait (jours, semaines, mois ou ans). Le paiement est traité via un lien sécurisé sur WhatsApp. Une fois le paiement confirmé, votre compte est activé et vous avez accès à toutes les fonctionnalités de votre plan pour générer des prédictions."
    },
    {
        question: "Puis-je utiliser l'application gratuitement ?",
        answer: "L'inscription est gratuite, mais pour générer des prédictions et utiliser notre analyseur IA, un abonnement actif est nécessaire. Nos plans sont conçus pour être accessibles et offrir une grande valeur pour améliorer vos stratégies de paris."
    }
];

const partners = [
    { name: "1xBet", logoUrl: "https://1xbet.ci/genfiles/cms/286-673/desktop/media_asset/f9936c0c6aa355afbb82ce9ea34d772f.svg", width: 120, height: 40, url: "https://1xbet.ci/fr", invert: true },
    { name: "Chopbet", logoUrl: "https://storage.googleapis.com/chopbet-ci-prod/apple_touch_icon_dark_a11c5711a8/apple_touch_icon_dark_a11c5711a8.png", width: 40, height: 40, url: "https://www.chopbet.com", invert: false },
    { name: "Betwinner", logoUrl: "https://betwinner.ci/wp-content/uploads/2024/11/betwinner_logo.svg", width: 150, height: 40, url: "https://betwinner.com", invert: true },
    { name: "Megapari", logoUrl: "https://v3.traincdn.com/genfiles/cms/192-824/desktop/media_asset/39b027cf6619aa7814a4f426943fc3f7.svg", width: 150, height: 40, url: "https://megapari.com", invert: true },
    { name: "Melbet", logoUrl: "https://v3.traincdn.com/genfiles/cms/8-62/desktop/media_asset/dd77c8f1b5bd23e38cd81fb7d861af10.svg", width: 150, height: 40, url: "https://melbet.com", invert: true },
    { name: "1Win", logoUrl: "https://1win.fyi/image/catalog/logo/1win-logo.svg", width: 120, height: 30, url: "https://1win.pro", invert: true },
    { name: "22Bet", logoUrl: "https://22bet.online/wp-content/uploads/2020/11/logo-22Bet.online.svg", width: 150, height: 40, url: "https://22bet.com", invert: true },
    { name: "888Starz", logoUrl: "https://v3.traincdn.com/genfiles/cms/233-789/desktop/media_asset/374278939704a56cdbe1763120d08c41.svg", width: 150, height: 40, url: "https://888starz.bet", invert: true },
];

const XIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TelegramIcon = (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
)

const InstallStep = ({ numIcon, instruction, detail }: { numIcon: React.ReactNode, instruction: React.ReactNode, detail: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-1">
            {numIcon}
        </div>
        <div>
            <div className="font-semibold text-foreground">{instruction}</div>
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    </div>
)

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [minePredictUrl, setMinePredictUrl] = useState("#");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroidInstallGuideOpen, setIsAndroidInstallGuideOpen] = useState(false);
  const [isIosInstallGuideOpen, setIsIosInstallGuideOpen] = useState(false);
  const [isWindowsInstallGuideOpen, setIsWindowsInstallGuideOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setIsAndroidInstallGuideOpen(true);
    }
  };

  const handleIosInstallClick = () => {
    setIsIosInstallGuideOpen(true);
  };
  
  const handleWindowsInstallClick = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    } else {
        setIsWindowsInstallGuideOpen(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push('/predict');
      } else {
        setIsCheckingAuth(false);
      }
    });
    
    const configDocRef = doc(db, "app_config", "urls");
    const unsubscribeConfig = onSnapshot(configDocRef, (configDoc) => {
        if (configDoc.exists() && configDoc.data().minePredictUrl) {
            setMinePredictUrl(configDoc.data().minePredictUrl);
        }
    }, (error) => {
        console.error("Error listening to app config:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeConfig();
    };
  }, [router]);
  
  if (isCheckingAuth) {
    return (
      <AnimatePresence>
        <motion.div 
            className="flex h-screen w-full items-center justify-center bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={80} height={80} priority />
                </motion.div>
                <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    Vérification de la session...
                </motion.p>
            </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Borders */}
      <div className="fixed top-0 left-0 h-full w-4 border-r border-border/10 z-50 pointer-events-none"></div>
      <div className="fixed top-0 right-0 h-full w-4 border-l border-border/10 z-50 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-screen-2xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="JetPredict Logo" width={32} height={32} className="h-8 w-auto rounded-md sm:h-9" style={{ height: 'auto' }} />
            <span className="text-xl sm:text-2xl font-bold text-primary">JetPredict</span>
          </Link>
           <div className="flex items-center gap-2">
                <Link href="/login" passHref>
                    <Button size="sm" className="rounded-full shadow-lg shadow-primary/20 sm:size-lg">
                        Commencer
                        <ChevronRight size={18} className="ml-1" />
                    </Button>
                </Link>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]"></div>
            <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c22,transparent)] -z-10"></div>
            <div className="container relative z-10">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-300">
                        Maximisez vos gains sur les paris sportifs !
                    </h1>
                    
                    <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                        JetPredict est votre assistant intelligent pour analyser les tendances de jeu et obtenir des prédictions de cotes fiables. Prenez une longueur d'avance avec des analyses de paris basées sur les données.
                    </p>
                    <p className="mt-4 max-w-xl text-lg text-primary/90 font-semibold">
                        Inscrivez-vous sur 1Win avec le code promo <span className="font-bold text-primary">JETPREDICT</span> pour bénéficier de 500% de bonus lors de votre premier rechargement.
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                        <Link href="/login" passHref>
                            <Button size="lg" className="font-semibold text-lg py-7 px-8 rounded-full group shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:shadow-primary/50">
                            Obtenir mes prédictions
                            <MoveUpRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            
            <div className="container relative z-10">
                 <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative flex justify-center items-center lg:h-[500px]"
                >
                    <div 
                    className="w-full h-full"
                    >
                         <Image
                        src="https://i.postimg.cc/XYRCXyF9/Jet-Predict.jpg"
                        alt="Tableau de bord JetPredict"
                        width={700}
                        height={700}
                        className="rounded-full shadow-2xl object-cover border-8 border-primary/10"
                        data-ai-hint="futuristic data"
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="absolute -top-4 -left-4 w-28 h-28 bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border border-border flex flex-col items-center justify-center"
                        >
                            <div className="text-4xl font-bold text-green-400">99%</div>
                            <div className="text-xs text-muted-foreground">Fiabilité</div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="absolute -bottom-8 right-0 w-36 h-24 bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border border-border p-3 flex items-center justify-center"
                        >
                            <div className="flex items-center gap-2">
                                <div className="text-primary"><TrendingUp /></div>
                                <div>
                                    <div className="font-bold text-2xl">x50.0</div>
                                    <div className="text-xs text-muted-foreground">Prochaine cote</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>

        {/* Social Proof Section */}
         <section className="py-20 relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]"></div>
            <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c22,transparent)] -z-10"></div>

            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
                    Approuvé par les parieurs professionnels
                </h2>
                <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Nos statistiques parlent d'elles-mêmes. Rejoignez une communauté qui gagne grâce à des prédictions fiables.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, index) => (
                         <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                            className="relative group p-6 rounded-2xl bg-card/50 border border-primary/20 hover:border-primary/50 transition-colors duration-300 shadow-lg hover:shadow-primary/10"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {stat.icon}
                                </div>
                                <p className="text-4xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>


        {/* About Section */}
        <section id="about" className="py-20 relative overflow-hidden">
             <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_400px,#313b5c33,transparent)]"></div>
            <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
                <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">La puissance de l'IA pour vos paris sportifs</h2>
                    <p className="text-muted-foreground text-lg">
                        JetPredict a été créé avec une mission simple : fournir aux parieurs les outils nécessaires pour prendre des décisions plus intelligentes. Nous combinons des modèles statistiques avancés et une intelligence artificielle pour vous offrir des prédictions claires, simples et surtout, utiles pour vos paris.
                    </p>
                </div>
                 <div className="flex justify-center">
                    <div className="relative w-72 h-72">
                         <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
                        <Globe className="w-full h-full text-primary opacity-40 animate-[spin_20s_linear_infinite]"/>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Pourquoi choisir JetPredict ?</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Tout ce dont vous avez besoin pour prendre une longueur d'avance et maximiser vos gains sur les paris sportifs.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                        >
                            <Card className="h-full bg-card/50 p-6 rounded-2xl border-primary/20 hover:border-primary/50 transition-colors duration-300 shadow-lg hover:shadow-primary/10 text-center group">
                               <div className="flex justify-center mb-4">
                                     <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                                        {feature.icon}
                                    </div>
                               </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Partner Logos Section */}
        <section id="partners" className="py-20">
            <div className="container mx-auto text-center">
                 <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Compatible avec vos plateformes de paris préférées</h2>
                <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
                    Utilisez les prédictions de JetPredict sur les sites de jeux les plus populaires pour placer vos paris.
                </p>
            </div>
            <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                    {partners.map((partner, index) => (
                        <li key={index} className="h-10 flex items-center">
                           {partner.logoUrl ? (
                                <Image 
                                    src={partner.logoUrl}
                                    alt={`${partner.name} logo`}
                                    width={partner.width}
                                    height={partner.height}
                                    className={cn("object-contain transition-transform hover:scale-110 h-10 w-auto", partner.invert && "dark:invert-0 invert")}
                                />
                           ) : (
                             <div className="text-xl sm:text-2xl font-bold text-muted-foreground transition-colors hover:text-foreground">
                                {partner.name}
                            </div>
                           )}
                        </li>
                    ))}
                </ul>
                <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
                    {partners.map((partner, index) => (
                        <li key={index} className="h-10 flex items-center">
                           {partner.logoUrl ? (
                                <Image 
                                    src={partner.logoUrl}
                                    alt={`${partner.name} logo`}
                                    width={partner.width}
                                    height={partner.height}
                                    className={cn("object-contain transition-transform hover:scale-110 h-10 w-auto", partner.invert && "dark:invert-0 invert")}
                                />
                           ) : (
                             <div className="text-xl sm:text-2xl font-bold text-muted-foreground transition-colors hover:text-foreground">
                                {partner.name}
                            </div>
                           )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 relative overflow-hidden">
             <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]"></div>
            <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c22,transparent)] -z-10"></div>
            <div className="container mx-auto relative z-10">
              <PricingSection isLandingPage={true} />
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_400px,#313b5c22,transparent)]"></div>
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Ils nous font confiance</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Découvrez ce que nos utilisateurs disent de nos prédictions de paris.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                        >
                            <Card className="bg-card/50 p-6 rounded-2xl border-primary/20 hover:border-primary/50 transition-colors duration-300 shadow-lg hover:shadow-primary/10 h-full">
                                <CardContent className="p-0">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368-2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.35 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <blockquote className="text-muted-foreground text-base italic border-l-2 border-primary pl-4">
                                        {testimonial.quote}
                                    </blockquote>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-muted/50">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Questions fréquentes</h2>
                    <p className="text-muted-foreground mt-2">Vous avez des questions ? Nous avons les réponses.</p>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqItems.map((item, index) => (
                         <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                        >
                            <AccordionItem value={`item-${index}`} className="bg-card/50 border border-primary/20 hover:border-primary/50 transition-colors duration-300 rounded-2xl shadow-lg hover:shadow-primary/10">
                                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline p-6">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base px-6 pb-6">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 relative">
             <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_50%,#313b5c22,transparent)]"></div>
            <div className="container mx-auto">
                <div 
                    className="text-center flex flex-col items-center"
                >
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Prêt à prendre l'avantage ?</h2>
                    <p className="text-muted-foreground mt-2 mb-8 max-w-xl mx-auto">Rejoignez des milliers de parieurs et commencez à prendre des décisions plus intelligentes dès aujourd'hui.</p>
                    <Link href="/login" passHref>
                        <Button size="lg" className="font-semibold text-lg py-7 px-8 rounded-full group shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:shadow-primary/50 hover:scale-105">
                          Commencez vos paris dès aujourd’hui
                          <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
        <footer className="bg-card border-t border-primary/10 px-4">
            <div className="container mx-auto max-w-screen-2xl py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4 items-start col-span-1 md:col-span-2 lg:col-span-1">
                         <Link href="/" className="flex items-center gap-2">
                            <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="JetPredict Logo" width={36} height={36} className="h-9 w-auto rounded-md" style={{ width: 'auto' }} />
                            <span className="text-xl font-bold text-primary">JetPredict</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">Prenez une longueur d'avance avec des analyses de paris basées sur les données.</p>
                    </div>

                    {/* Links Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Explorer</h3>
                        <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Fonctionnalités</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Tarifs</Link>
                        <Link href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Témoignages</Link>
                        <Link href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
                    </div>

                     {/* Legal Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Légal</h3>
                        <Link href="/legal/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors">Mentions Légales</Link>
                        <Link href="/legal/cgu" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link>
                        <Link href="/legal/cgv" className="text-muted-foreground hover:text-primary transition-colors">Conditions de vente</Link>
                        <Link href="/legal/confidentialite" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link>
                        <Link href="/legal/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </div>

                    {/* Partners Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Partenaires</h3>
                        {partners.slice(0, 5).map((partner, index) => (
                             <Link key={index} href={partner.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">{partner.name}</Link>
                        ))}
                    </div>

                    {/* Social & PWA Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Restez Connecté</h3>
                        <div className="flex space-x-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><XIcon className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><InstagramIcon className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><TelegramIcon className="h-5 w-5" /></Link>
                        </div>
                        <div className="mt-4">
                            <iframe
                              src="/api/telegram-widget"
                              style={{border: 'none', width: '220px', height: '50px'}}
                              title="Rejoindre le bot Telegram"
                            ></iframe>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 mt-4">Télécharger l'App</h3>
                        <div className="flex flex-col sm:flex-row items-end gap-2 justify-start">
                            <button onClick={handleAndroidInstallClick} className="cursor-pointer">
                                <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Download on Google Play" width={60} height={35} />
                            </button>
                            <button onClick={handleIosInstallClick} className="cursor-pointer">
                                <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="Download on the App Store" width={60} height={35} className={cn("dark:invert-0 invert")}/>
                            </button>
                             <button onClick={handleWindowsInstallClick} className="cursor-pointer">
                                <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Download for Windows" width={60} height={35} />
                            </button>
                        </div>
                         {deferredPrompt && (
                            <Button onClick={handleAndroidInstallClick} className="mt-2">
                                <Download className="mr-2 h-4 w-4" />
                                Installer l'application
                            </Button>
                         )}
                    </div>
                </div>

                <div className="mt-8 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                     <p className="text-sm text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} JetPredict — #D3 Officiel
                    </p>
                    <div className="flex items-center gap-2">
                        <Image src="https://dam.begmedia.com/front/tactics/icons/light/age_restriction.f38d38a8.svg" width={20} height={20} alt="18+" />
                        <p className="text-xs text-muted-foreground/50 text-center md:text-right">
                           Jouez de manière responsable.
                        </p>
                    </div>
                </div>
            </div>
        </footer>

        <Dialog open={isAndroidInstallGuideOpen} onOpenChange={setIsAndroidInstallGuideOpen}>
            <DialogContent className="bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                         <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Android" width={24} height={24} />
                        Guide d'installation pour Android
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm py-4">
                    <InstallStep 
                        numIcon={<MoreVertical />}
                        instruction={<>Ouvrez le menu du navigateur</>}
                        detail="Appuyez sur l'icône de menu (généralement 3 points) en haut à droite de Chrome."
                    />
                     <InstallStep 
                        numIcon={<Download />}
                        instruction={<>Sélectionnez <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Installer l'application</span></>}
                        detail="Cette option ajoutera JetPredict à votre écran d'accueil."
                    />
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isIosInstallGuideOpen} onOpenChange={setIsIosInstallGuideOpen}>
            <DialogContent className="bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="iOS" width={24} height={24} className={cn("dark:invert-0 invert")}/>
                        Guide d'installation pour iOS
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm py-4">
                    <InstallStep 
                        numIcon={<Share2 />}
                        instruction={<>Ouvrez le menu de partage</>}
                        detail="Appuyez sur l'icône de Partage (un carré avec une flèche vers le haut) dans Safari."
                    />
                     <InstallStep 
                        numIcon={<Smartphone />}
                        instruction={<>Sélectionnez <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Sur l'écran d'accueil</span></>}
                        detail="Faites défiler la liste des options et appuyez sur ce bouton."
                    />
                    <InstallStep 
                        numIcon={<CheckCircle />}
                        instruction={<>Confirmez l'ajout</>}
                        detail="Appuyez sur 'Ajouter' en haut à droite pour finaliser l'installation."
                    />
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isWindowsInstallGuideOpen} onOpenChange={setIsWindowsInstallGuideOpen}>
            <DialogContent className="bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                        <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Windows" width={24} height={24} />
                        Guide d'installation pour Ordinateur
                    </DialogTitle>
                </DialogHeader>
                 <div className="space-y-6 text-sm py-4">
                    <InstallStep 
                        numIcon={<MonitorDown />}
                        instruction={<>Trouvez l'icône d'installation</>}
                        detail="Cherchez l'icône d'installation (un écran avec une flèche) dans la barre d'adresse de votre navigateur (Chrome, Edge)."
                    />
                     <InstallStep 
                        numIcon={<Download />}
                        instruction={<>Cliquez sur <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Installer</span></>}
                        detail="Confirmez l'installation lorsque la fenêtre pop-up apparaît."
                    />
                    <p className="text-xs text-muted-foreground pt-2">Alternativement, vous pouvez ouvrir le menu du navigateur (⋮) et sélectionner "Installer JetPredict".</p>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    

    
