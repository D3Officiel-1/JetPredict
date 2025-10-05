
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, BarChart, ChevronRight, Zap, BrainCircuit, Award, Quote, Users, TrendingUp, PlayCircle, CheckCircle, MoveUpRight, Globe, Loader2, Star, XCircle, ShieldCheck, Crown, Download, HelpCircle, MoreVertical, Share, MonitorDown, Share2, MoreHorizontal, AppWindow, Smartphone, LineChart } from "lucide-react";
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
        icon: <Zap className="h-8 w-8" />,
        title: "Prédictions en Temps Réel",
        description: "Obtenez des cotes suggérées instantanément en fonction du niveau de risque que vous choisissez.",
    },
    {
        icon: <BrainCircuit className="h-8 w-8" />,
        title: "Fiabilité par l'IA",
        description: "Notre IA analyse des milliers de points de données pour vous donner un indice de confiance fiable.",
    },
    {
        icon: <Award className="h-8 w-8" />,
        title: "Stratégies Gagnantes",
        description: "Accédez à des stratégies de paris adaptées, que vous soyez prudent ou audacieux.",
    },
];

const testimonials = [
    {
        name: "Moussa K.",
        role: "Utilisateur VIP",
        rating: 5,
        quote: "Jet Predict a changé ma façon de parier. Les prédictions pour les matchs de foot sont incroyablement précises. L'indice de fiabilité est un vrai plus !",
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
        icon: <Users className="h-10 w-10 text-primary" />,
        value: "3,500+",
        label: "Utilisateurs satisfaits"
    },
    {
        icon: <TrendingUp className="h-10 w-10 text-primary" />,
        value: "100,000+",
        label: "Prédictions générées"
    },
    {
        icon: <Award className="h-10 w-10 text-primary" />,
        value: "98%",
        label: "Fiabilité moyenne"
    }
];



const faqItems = [
    {
        question: "Qu'est-ce que Jet Predict exactement ?",
        answer: "Jet Predict est un outil d'aide à la décision pour les paris sportifs et les jeux de crash. Il utilise des modèles statistiques et une IA pour analyser les tendances et vous fournir des cotes de retrait suggérées afin de vous aider à prendre des décisions plus éclairées et à augmenter vos chances de gains."
    },
    {
        question: "Les prédictions sont-elles garanties à 100% ?",
        answer: "Non. Jet Predict est un outil statistique puissant conçu pour vous donner un avantage en identifiant des tendances probables. Cependant, comme pour tout jeu de hasard, le risque zéro n'existe pas. Jouez toujours de manière responsable."
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
    { name: "1xBet", logoUrl: "https://1xbet.ci/genfiles/cms/286-673/desktop/media_asset/f9936c0c6aa355afbb82ce9ea34d772f.svg", width: 120, height: 40, url: "https://1xbet.ci/fr", invertInLight: false, invertInDark: true },
    { name: "Chopbet", logoUrl: "https://storage.googleapis.com/chopbet-ci-prod/apple_touch_icon_dark_a11c5711a8/apple_touch_icon_dark_a11c5711a8.png", width: 40, height: 40, url: "https://www.chopbet.com", invertInLight: false, invertInDark: false },
    { name: "Betwinner", logoUrl: "https://betwinner.ci/wp-content/uploads/2024/11/betwinner_logo.svg", width: 150, height: 40, url: "https://betwinner.com", invertInLight: false, invertInDark: true },
    { name: "Megapari", logoUrl: "https://v3.traincdn.com/genfiles/cms/192-824/desktop/media_asset/39b027cf6619aa7814a4f426943fc3f7.svg", width: 150, height: 40, url: "https://megapari.com", invertInLight: false, invertInDark: true },
    { name: "Melbet", logoUrl: "https://v3.traincdn.com/genfiles/cms/8-62/desktop/media_asset/dd77c8f1b5bd23e38cd81fb7d861af10.svg", width: 150, height: 40, url: "https://melbet.com", invertInLight: false, invertInDark: true },
    { name: "1Win", logoUrl: "https://1win.fyi/image/catalog/logo/1win-logo.svg", width: 120, height: 30, url: "https://1win.pro", invertInLight: false, invertInDark: true },
    { name: "22Bet", logoUrl: "https://22bet.online/wp-content/uploads/2020/11/logo-22Bet.online.svg", width: 150, height: 40, url: "https://22bet.com", invertInLight: false, invertInDark: true },
    { name: "888Starz", logoUrl: "https://v3.traincdn.com/genfiles/cms/233-789/desktop/media_asset/374278939704a56cdbe1763120d08c41.svg", width: 150, height: 40, url: "https://888starz.bet", invertInLight: false, invertInDark: true },
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

const InstallStep = ({ num, instruction, detail }: { num: string, instruction: React.ReactNode, detail: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 shrink-0 mt-1 font-bold text-lg">
            {num}
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

const loadingTexts = [
    "DÉMARRAGE DU NOYAU...",
    "ACCÈS AU DATACLUSTER...",
    "CHARGEMENT DES MODÈLES IA...",
    "VÉRIFICATION DES PROTOCOLES...",
    "SYNCHRONISATION TERMINÉE.",
];

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [minePredictUrl, setMinePredictUrl] = useState("#");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroidInstallGuideOpen, setIsAndroidInstallGuideOpen] = useState(false);
  const [isIosInstallGuideOpen, setIsIosInstallGuideOpen] = useState(false);
  const [isWindowsInstallGuideOpen, setIsWindowsInstallGuideOpen] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

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
        setTimeout(() => setIsCheckingAuth(false), 3000);
      }
    });
    
    const textInterval = setInterval(() => {
        setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
    }, 500);

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
      clearInterval(textInterval);
    };
  }, [router]);
  
  if (isCheckingAuth) {
    return (
      <motion.div 
          className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side,hsl(var(--background)),transparent)]"></div>

        <motion.div 
          className="relative w-32 h-32 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }}
        >
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full border-2 border-primary/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="w-full h-full object-contain" priority />
        </motion.div>

        <div className="relative w-64 h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="h-6 mt-4">
            <AnimatePresence mode="wait">
                <motion.p
                    key={loadingTextIndex}
                    className="font-code text-sm text-primary tracking-widest"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {loadingTexts[loadingTextIndex]}
                </motion.p>
            </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 p-4">
          <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              className="container mx-auto flex items-center justify-between p-2 rounded-2xl bg-card/50 dark:bg-black/20 backdrop-blur-md border border-border/50 dark:border-white/10"
          >
              <Link href="/" className="flex items-center gap-2.5">
                  <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={32} height={32} className="h-8 w-auto rounded-md" />
                  <span className="text-lg font-bold text-primary">Jet Predict</span>
              </Link>
              <Link href="/login" passHref>
                  <Button variant="ghost" className="rounded-full">
                      Commencer
                      <ChevronRight size={16} className="ml-1" />
                  </Button>
              </Link>
          </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center min-h-[100vh] py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-20 bg-background dark:bg-[#0A0F1E]"></div>
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-5 dark:opacity-5"></div>
          
          <motion.div
              className="absolute top-0 left-0 w-[40rem] h-[40rem] rounded-full bg-primary/10 dark:bg-primary/10 blur-3xl opacity-50 dark:opacity-50"
              animate={{ x: [-100, 50], y: [-50, 100], scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 30, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
              className="absolute bottom-0 right-0 w-[50rem] h-[50rem] rounded-full bg-blue-500/10 dark:bg-blue-500/10 blur-3xl opacity-50 dark:opacity-50"
              animate={{ x: [100, -50], y: [50, -100], scale: [1, 1.2, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 40, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />

          <div className="container relative z-10 flex flex-col items-center">
              <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
              >
                  <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20">
                      Version 2.0 avec IA Avancée
                  </span>
              </motion.div>
              
              <motion.h1 
                  className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
              >
                  <span className="block bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground dark:from-white dark:to-gray-400">Passez au niveau</span>
                  <span className="block text-primary drop-shadow-[0_0_20px_hsl(var(--primary))]">supérieur.</span>
              </motion.h1>
              
              <motion.p 
                  className="mt-6 max-w-xl text-lg text-muted-foreground"
                   initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.7 }}
              >
                  Jet Predict transforme vos paris en stratégies. Obtenez des prédictions de cotes fiables grâce à notre IA et prenez l'avantage.
              </motion.p>
              
              <motion.div
                className="my-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7 }}
              >
                <div className="relative inline-block p-1 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse shadow-[0_0_20px_rgba(255,165,0,0.5)]">
                    <div className="bg-background/80 dark:bg-background/80 rounded-[14px] px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center gap-3">
                        <p className="text-sm sm:text-base font-semibold text-foreground dark:text-white">
                            Inscris-toi sur <span className="font-bold text-yellow-500 dark:text-yellow-300">1Win</span> avec le code <span className="font-bold text-yellow-500 dark:text-yellow-300">JETPREDICT</span> et gagne <span className="font-bold text-yellow-500 dark:text-yellow-300">500%</span> de bonus !
                        </p>
                        <a href="https://1wlucb.life/v3/lucky-jet-updated?p=s5wy" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="bg-transparent text-yellow-600 dark:text-yellow-300 border-yellow-400/50 hover:bg-yellow-400/10 hover:text-yellow-500 dark:hover:text-yellow-200">
                                S'inscrire sur 1Win
                            </Button>
                        </a>
                    </div>
                </div>
              </motion.div>
              
               <motion.div
                  className="flex flex-wrap justify-center gap-4"
                   initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.7 }}
              >
                  <Link href="/login" passHref>
                      <Button
                          size="lg"
                          className="font-semibold text-lg py-7 px-8 rounded-full group shadow-[0_0_25px_hsl(var(--primary)/0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] hover:scale-105"
                      >
                          <span className="relative flex items-center">
                              Activer le Protocole
                              <MoveUpRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                          </span>
                      </Button>
                  </Link>
              </motion.div>
               <motion.div 
                  className="mt-12 w-full max-w-4xl"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 1 }}
               >
                  <div className="relative p-1 rounded-2xl bg-gradient-to-br from-primary/50 via-blue-500/30 to-transparent">
                      <div className="p-1 rounded-[14px] bg-background">
                          <Image
                              src="https://i.postimg.cc/XYRCXyF9/Jet-Predict.jpg"
                              alt="Tableau de bord Jet Predict"
                              width={1200}
                              height={625}
                              className="object-cover rounded-xl shadow-2xl shadow-primary/20"
                              priority
                              data-ai-hint="dashboard futuristic"
                          />
                      </div>
                  </div>
              </motion.div>
          </div>
      </section>

        {/* Social Proof Section */}
        <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:opacity-5"></div>
            <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)] -z-10"></div>
            <div className="container mx-auto text-center">
                <motion.h2 
                    className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-neutral-50 dark:to-neutral-400 bg-opacity-50"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    Approuvé par les parieurs professionnels
                </motion.h2>
                <motion.p 
                    className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    Rejoignez une communauté qui prend l'avantage grâce à des prédictions basées sur des millions de points de données.
                </motion.p>
                <motion.div 
                    className="relative p-8 rounded-2xl bg-card/50 border border-primary/20 shadow-2xl shadow-primary/10 max-w-5xl mx-auto"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-5 -z-10"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-primary/20">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                viewport={{ once: true }}
                                className="group flex flex-col items-center gap-3 p-6 md:p-0 md:px-6 first:pt-0 last:pb-0"
                            >
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse group-hover:opacity-50"></div>
                                    {stat.icon}
                                </div>
                                <p className="text-4xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
        
        {/* About Section */}
        <section id="about" className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_50%,hsl(var(--primary)/0.15),transparent)]"></div>
            <div className="container mx-auto text-center px-4">
                <motion.div 
                    className="relative w-full max-w-[400px] h-[400px] mx-auto mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                >
                    <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div 
                        className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div 
                        className="absolute inset-8 bg-primary/10 rounded-full blur-2xl"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-1/2 h-1/2 text-primary opacity-50"/>
                    </div>
                </motion.div>

                <motion.h2 
                    className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-white dark:to-gray-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    L'IA au service de votre intuition
                </motion.h2>
                <motion.p 
                    className="text-muted-foreground text-lg max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                >
                    Jet Predict a été conçu pour amplifier vos stratégies de pari. Nous fusionnons l'analyse de données à grande échelle avec l'intelligence artificielle pour transformer des millions de points de données brutes en prédictions claires et exploitables, vous donnant un avantage décisif.
                </motion.p>
            </div>
        </section>


        {/* Features Section */}
        <section id="features" className="py-20 relative bg-muted/20 dark:bg-muted/50 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_farthest-side_at_50%_0,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(circle_farthest-side_at_50%_0,hsl(var(--primary)/0.1),transparent)]"></div>
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-neutral-50 dark:to-neutral-400">Un Arsenal d'Outils à votre Service</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Chaque fonctionnalité est conçue pour vous donner une longueur d'avance.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="group relative p-1 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-2xl"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                        >
                           <div className="h-full bg-card/80 backdrop-blur-lg p-8 rounded-[15px] text-center border border-transparent group-hover:border-primary/50 transition-colors duration-300">
                               <div className="relative inline-block p-4 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                                  <div className="absolute inset-0 rounded-full animate-spin border-2 border-dashed border-primary/50" style={{ animationDuration: '10s' }}></div>
                                  {feature.icon}
                              </div>
                               <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                               <p className="text-muted-foreground">{feature.description}</p>
                           </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Partner Logos Section */}
        <section id="partners" className="py-20">
            <div className="container mx-auto text-center">
                <motion.h2 
                    className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-neutral-50 dark:to-neutral-400"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    Compatible avec vos plateformes préférées
                </motion.h2>
                <motion.p 
                    className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    Utilisez les prédictions de Jet Predict sur les sites de jeux les plus populaires pour placer vos paris.
                </motion.p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {partners.map((partner, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                            viewport={{ once: true }}
                        >
                            <a href={partner.url} target="_blank" rel="noopener noreferrer" className="group relative flex h-24 items-center justify-center rounded-2xl bg-card/50 p-4 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/50 hover:-translate-y-1">
                                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                <Image
                                    src={partner.logoUrl}
                                    alt={`${partner.name} logo`}
                                    width={partner.width}
                                    height={partner.height}
                                    className={cn("object-contain transition-transform group-hover:scale-110 h-10 w-auto", {
                                        'invert dark:invert-0': partner.invertInLight,
                                        'dark:invert-0': partner.invertInDark && !partner.invertInLight,
                                    })}
                                />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 relative overflow-hidden">
             <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-size-[14px_24px] dark:bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)]"></div>
            <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)] -z-10"></div>
            <div className="container mx-auto relative z-10">
              <PricingSection isLandingPage={true} />
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_400px,hsl(var(--primary)/0.05),transparent)] dark:bg-[radial-gradient(circle_1000px_at_50%_400px,hsl(var(--primary)/0.08),transparent)]"></div>
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-neutral-50 dark:to-neutral-400">Ils nous font confiance</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Découvrez ce que nos utilisateurs disent de nos prédictions de paris.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            className="relative group"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                        >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <Card className="relative bg-card/80 backdrop-blur-lg p-6 rounded-2xl border border-border/20 group-hover:border-primary/30 transition-colors duration-300 h-full flex flex-col">
                                <CardContent className="p-0 flex-grow flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="w-12 h-12 border-2 border-primary/50">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${testimonial.name}`} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-lg text-foreground">{testimonial.name}</p>
                                            <p className="text-sm text-primary">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-grow my-4 relative">
                                        <Quote className="absolute -top-2 left-0 w-16 h-16 text-primary/5 dark:text-primary/10 opacity-50" />
                                        <blockquote className="text-muted-foreground text-base italic relative z-10 pl-6">
                                            {testimonial.quote}
                                        </blockquote>
                                    </div>

                                    <div className="flex justify-end mt-auto pt-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 relative overflow-hidden">
             <div className="absolute inset-0 -z-10 bg-background/50 dark:bg-background">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side_at_50%_0,hsl(var(--primary)/0.05),transparent)]"></div>
            </div>
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-neutral-50 dark:to-neutral-400">Transmission de données</h2>
                    <p className="text-muted-foreground mt-2">Les réponses à vos interrogations les plus fréquentes.</p>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqItems.map((item, index) => (
                         <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <AccordionItem value={`item-${index}`} className="group border-b-0">
                                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline p-4 bg-card/50 border-l-2 border-primary/30 data-[state=open]:border-primary transition-all rounded-lg shadow-sm hover:bg-card/70 data-[state=open]:bg-card/70 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/10">
                                    <span className="group-data-[state=open]:text-primary transition-colors">{item.question}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base p-6 bg-card/30 rounded-b-lg border-t-0 border-x-2 border-primary/20 -mt-1">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
             <div className="absolute inset-0 -z-20 bg-background dark:bg-[#0A0F1E]"></div>
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_1000px_at_50%_50%,hsl(var(--primary)/0.1),transparent)] dark:bg-[radial-gradient(circle_1000px_at_50%_50%,hsl(var(--primary)/0.15),transparent)]"></div>
            <motion.div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 bg-primary/10 dark:bg-primary/20 blur-3xl"
                animate={{
                    scaleX: [1, 1.5, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
            />

            <div className="container relative z-10 mx-auto text-center">
                <motion.h2 
                    className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground dark:from-white dark:to-gray-300 drop-shadow-[0_0_20px_rgba(128,128,128,0.2)] dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    Prêt à prendre l'avantage ?
                </motion.h2>
                <motion.p 
                    className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                >
                    Rejoignez des milliers de parieurs et commencez à prendre des décisions plus intelligentes dès aujourd'hui.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <Link href="/login" passHref>
                        <Button
                            size="lg"
                            className="font-semibold text-lg py-7 px-10 rounded-full group bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_15px_40px_hsl(var(--primary)/0.6)] hover:scale-105 hover:from-primary/90 hover:to-cyan-400/90"
                        >
                            Commencez maintenant
                            <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>


      </main>

      {/* Footer */}
        <footer className="bg-card/30 dark:bg-black/20 border-t border-primary/10">
            <div className="container mx-auto py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4 items-start col-span-1 lg:col-span-2">
                         <Link href="/" className="flex items-center gap-2">
                            <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={36} height={36} className="h-9 w-auto rounded-md" style={{ width: 'auto' }} />
                            <span className="text-xl font-bold text-primary">Jet Predict</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-sm">Prenez une longueur d'avance avec des analyses de paris basées sur les données.</p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><XIcon className="h-5 w-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><InstagramIcon className="h-5 w-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><TelegramIcon className="h-5 w-5" /></a>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Explorer</h3>
                        <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Fonctionnalités</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Tarifs</Link>
                        <Link href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
                    </div>

                     {/* Legal Section */}
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-foreground mb-2">Légal</h3>
                        <Link href="/legal/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors">Mentions Légales</Link>
                        <Link href="/legal/cgu" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link>
                        <Link href="/legal/cgv" className="text-muted-foreground hover:text-primary transition-colors">Conditions de vente</Link>
                        <Link href="/legal/confidentialite" className="text-muted-foreground hover:text-primary transition-colors">Confidentialité</Link>
                        <Link href="/legal/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </div>

                    {/* App & Bot Section */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">Télécharger l'App</h3>
                             <div className="flex items-center gap-2">
                                <button onClick={handleAndroidInstallClick} className="cursor-pointer">
                                     <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Download on Google Play" width={60} height={35} />
                                 </button>
                                 <button onClick={handleIosInstallClick} className="cursor-pointer">
                                     <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="Download on the App Store" width={60} height={35} className="dark:invert-0 invert"/>
                                 </button>
                                  <button onClick={handleWindowsInstallClick} className="cursor-pointer">
                                     <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Download for Windows" width={60} height={35} />
                                 </button>
                             </div>
                        </div>
                        <div>
                           <h3 className="font-semibold text-foreground mb-2">Notre Bot Telegram</h3>
                            <iframe
                              src="/api/telegram-widget"
                              style={{border: 'none', width: '180px', height: '50px'}}
                              title="Rejoindre le bot Telegram"
                            ></iframe>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <p className="text-sm text-muted-foreground text-center sm:text-left">
                        © {new Date().getFullYear()} Jet Predict — #D3 Officiel
                    </p>
                    <div className="flex items-center gap-2">
                        <Image src="https://dam.begmedia.com/front/tactics/icons/light/age_restriction.f38d38a8.svg" width={20} height={20} alt="18+" />
                        <p className="text-xs text-muted-foreground/50 text-center sm:text-right">
                           Jouez de manière responsable.
                        </p>
                    </div>
                </div>
            </div>
        </footer>

        <Dialog open={isAndroidInstallGuideOpen} onOpenChange={setIsAndroidInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591873/qqwdfy0d632otqf682bu.svg" alt="Android" width={28} height={28} />
                        Protocole d'Installation : Android
                    </DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                    <div className="space-y-6 text-sm">
                        <InstallStep
                            num="1"
                            instruction={<>Ouvrez le menu du navigateur</>}
                            detail="Dans Chrome, appuyez sur l'icône de menu (généralement 3 points) en haut à droite pour afficher les options."
                        />
                         <InstallStep
                            num="2"
                            instruction={<>Sélectionnez "Installer l'application"</>}
                            detail="Cette action ajoutera Jet Predict à votre écran d'accueil, vous donnant un accès direct comme une application native."
                        />
                         <InstallStep
                            num="3"
                            instruction={<>Confirmez et lancez</>}
                            detail="Validez l'installation. L'icône Jet Predict apparaîtra parmi vos autres applications. Profitez de l'expérience optimisée !"
                        />
                    </div>
                    <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591873/o9gyl6yrq8f6tllqf0t7.svg" alt="Android UI" width={200} height={400} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isIosInstallGuideOpen} onOpenChange={setIsIosInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591873/k7k2pg9c6i0q3j9k8h6n.svg" alt="iOS" width={28} height={28} />
                        Protocole d'Installation : iOS
                    </DialogTitle>
                </DialogHeader>
                 <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                    <div className="space-y-6 text-sm">
                        <InstallStep 
                            num="1"
                            instruction={<>Ouvrez le menu de partage</>}
                            detail="Dans Safari, appuyez sur l'icône de Partage (un carré avec une flèche vers le haut) située dans la barre de navigation."
                        />
                         <InstallStep 
                            num="2"
                            instruction={<>Sélectionnez "Sur l'écran d'accueil"</>}
                            detail="Faites défiler la liste des options de partage vers le bas et appuyez sur ce bouton pour créer un raccourci d'application."
                        />
                         <InstallStep 
                            num="3"
                            instruction={<>Confirmez l'ajout</>}
                            detail="Vérifiez le nom de l'application et appuyez sur 'Ajouter' en haut à droite pour finaliser l'installation sur votre appareil."
                        />
                    </div>
                    <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591873/h7j8p3ofk404t8p41y1v.svg" alt="iOS UI" width={200} height={400} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isWindowsInstallGuideOpen} onOpenChange={setIsWindowsInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                     <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591873/pyq5g1yrv6j0c1n8p7z0.svg" alt="Windows" width={28} height={28} />
                        Protocole d'Installation : Ordinateur
                    </DialogTitle>
                </DialogHeader>
                 <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                     <div className="space-y-6 text-sm">
                        <InstallStep 
                            num="1"
                            instruction={<>Trouvez l'icône d'installation</>}
                            detail="Dans la barre d'adresse de votre navigateur (Chrome, Edge), cherchez une icône représentant un écran avec une flèche vers le bas."
                        />
                        <InstallStep 
                            num="2"
                            instruction={<>Cliquez sur "Installer"</>}
                            detail="Une petite fenêtre apparaîtra pour vous proposer d'installer l'application. Cliquez sur le bouton 'Installer' pour confirmer."
                        />
                         <p className="text-xs text-muted-foreground pt-2 pl-14">Alternativement, ouvrez le menu du navigateur (⋮) et sélectionnez "Installer Jet Predict".</p>
                    </div>
                     <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30">
                        <Image src="https://res.cloudinary.com/dazt6g3o1/image/upload/v1721591874/g6g1y5f2z7q2y2q3q2w8.svg" alt="Desktop UI" width={300} height={150} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
