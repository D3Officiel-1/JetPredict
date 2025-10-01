

'use client';

import { useState, useEffect, useRef, useCallback }
from 'react';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, getDoc, collection, query, where } from "firebase/firestore";
import { app, db, requestForToken, onMessageListener } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { CrashPredictorDashboard } from '@/components/crash-predictor-dashboard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Beaker, Bell, LifeBuoy, Loader2, Users, ShieldAlert, HelpCircle, StepForward, Target, Lightbulb, Gamepad2, Wallet, BrainCircuit, PiggyBank, BarChart, TrendingUp, TrendingDown, Repeat, Sigma, PieChart, Waypoints, Goal, StopCircle, CloudFog, Combine, Trophy, ShieldCheck, PauseCircle, Wrench, Table as TableIcon, MoreVertical, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanId } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TelegramIcon, WhatsAppIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { SinglePrediction } from '@/types';


const GuideStep = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-1">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

const StrategyGuideStep = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="text-primary mt-1">{icon}</div>
        <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="text-sm text-muted-foreground prose prose-p:my-1">{children}</div>
        </div>
    </div>
);

export default function PredictPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ notificationSettings?: { alertsEnabled?: boolean, soundEnabled?: boolean, vibrationEnabled?: boolean } } | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const notifiedPredictions = useRef(new Set());


  useEffect(() => {
    if (user) {
        requestForToken(user);
    }
    
    if ('Notification' in window) {
      onMessageListener()
        .then((payload: any) => {
          toast({
              title: payload.notification.title,
              description: payload.notification.body,
              variant: 'default',
          });
        })
        .catch((err) => console.log('failed: ', err));
    }
  }, [user, toast]);
  
  const checkPredictionsForNotifications = useCallback(() => {
    const event = new CustomEvent('checkPredictions');
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkPredictionsForNotifications();
    }, 1000);
    return () => clearInterval(interval);
  }, [checkPredictionsForNotifications]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      if (!currentUser.emailVerified) {
        router.push('/verify-email');
        return;
      }

      let unsubscribeMaintenance: () => void;
      let unsubscribePricing: () => void;
      let unsubscribeNotifications: () => void;
      let unsubscribeUserData: () => void;
      
      const maintenanceDocRef = doc(db, "applications", "VMrS6ltRDuKImzxAl3lR");

      unsubscribeMaintenance = onSnapshot(maintenanceDocRef, async (maintenanceDoc) => {
          if (maintenanceDoc.exists()) {
              const appData = maintenanceDoc.data();
              if (appData.status === true) {
                  router.push('/maintenance');
                  return;
              }
              if (appData.maintenanceConfig?.status === true) {
                  const targetUsers = appData.maintenanceConfig.targetUsers || [];
                  if (targetUsers.length === 0) {
                      router.push('/maintenance');
                      return;
                  }
                  const pricingDoc = await getDoc(doc(db, "users", currentUser.uid, "pricing", "jetpredict"));
                  if (pricingDoc.exists() && targetUsers.includes(pricingDoc.data().idplan_jetpredict)) {
                      router.push('/maintenance');
                      return;
                  }
              }
          }

          const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
          
          if (unsubscribePricing) unsubscribePricing();

          unsubscribePricing = onSnapshot(pricingDocRef, async (pricingDoc) => {
            if (pricingDoc.exists()) {
                const pricingData = pricingDoc.data();
                if (pricingData.actif_jetpredict === true && pricingData.findate?.toDate() > new Date()) {
                    setUser(currentUser);
                    setPlanId(pricingData.idplan_jetpredict);
                    setIsLoading(false);
                } else {
                    if (pricingData.actif_jetpredict === true) await updateDoc(pricingDocRef, { actif_jetpredict: false });
                    router.push('/pricing');
                }
            } else {
              router.push('/pricing');
            }
          }, (error) => {
            console.error("Erreur de tarification:", error);
            router.push('/login');
          });

      }, (error) => {
          console.error("Erreur de maintenance:", error);
          router.push('/login');
      });

      const personalNotificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
      const qPersonal = query(personalNotificationsRef, where('isRead', '==', false));
      unsubscribeNotifications = onSnapshot(qPersonal, (snapshot) => {
          setUnreadCount(snapshot.size);
      });
      
      const userDocRef = doc(db, "users", currentUser.uid);
      unsubscribeUserData = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
              setUserData(doc.data());
          }
      });


      return () => {
          if (unsubscribeMaintenance) unsubscribeMaintenance();
          if (unsubscribePricing) unsubscribePricing();
          if (unsubscribeNotifications) unsubscribeNotifications();
          if (unsubscribeUserData) unsubscribeUserData();
      };
    });

     const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth, router]);

  const handleLogout = async () => {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { isOnline: false });
    }
    await signOut(auth);
    router.push('/login');
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (user?.displayName) {
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : '??';
  };
  
  const isVerified = user?.emailVerified === true;
  const canAccessPremiumFeatures = planId === 'weekly' || planId === 'monthly';
  const canAccessSupport = planId === 'monthly';


  if (isLoading || !user || !planId) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
        <p className="mt-4 text-muted-foreground">Vérification de l'abonnement...</p>
      </div>
    );
  }

    const fabMenuVariants = {
        open: {
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        },
        closed: {
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        }
    };

    const fabItemVariants = {
        open: (i: number) => ({
            y: -80 * (i + 1),
            opacity: 1,
            transition: {
                y: { stiffness: 1000, velocity: -100 }
            }
        }),
        closed: {
            y: 0,
            opacity: 0,
            transition: {
                y: { stiffness: 1000 }
            }
        }
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-4">
          <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="JetPredict Logo" width={36} height={36} className="h-9 w-auto rounded-md" style={{ width: 'auto' }} />
          <h1 className="font-headline text-xl font-bold text-primary">
            JetPredict
          </h1>
        </div>
        <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL ?? ''} alt="Avatar" />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                          </Avatar>
                           {unreadCount > 0 && <span className="premium-notification-pulse"></span>}
                           {!isVerified && (
                              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                          )}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                {unreadCount > 0 && (
                   <TooltipContent>
                      <p>Vous avez {unreadCount} notification(s) non lue(s)</p>
                   </TooltipContent>
                )}
                 {!isVerified && (
                  <TooltipContent>
                      <p>Veuillez vérifier votre email</p>
                  </TooltipContent>
                 )}
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'Mon Compte'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
             {!isVerified && (
                  <DropdownMenuItem asChild>
                      <Link href="/verify-email" className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          <span>Email non vérifié</span>
                      </Link>
                  </DropdownMenuItem>
              )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild disabled={!isVerified}>
              <Link href="/notification">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
                 {unreadCount > 0 && <span className="notification-dot"></span>}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!isVerified}>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!isVerified}>
              <Link href="/referral">
                <Users className="mr-2 h-4 w-4" />
                <span>Parrainage</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild disabled={!isVerified || !canAccessPremiumFeatures}>
                <Link href="/simulation">
                    <Beaker className="mr-2 h-4 w-4" />
                    <span>Simulation</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!isVerified}>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!isVerified || !canAccessSupport}>
              <Link href="/support">
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <CrashPredictorDashboard planId={planId} notificationSettings={userData?.notificationSettings} />
      </main>

       <motion.div
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40"
        initial="closed"
        animate={isFabMenuOpen ? "open" : "closed"}
    >
        <AnimatePresence>
            {isFabMenuOpen && (
                <motion.div variants={fabMenuVariants} className="flex flex-col items-center absolute bottom-0 right-0">
                    <motion.div variants={fabItemVariants} custom={2} className="absolute bottom-0 right-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href="https://www.whatsapp.com/channel/0029VbBc22V4yltHAKWD0R2x" target="_blank" rel="noopener noreferrer">
                                        <Button className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/40">
                                            <WhatsAppIcon className="h-7 w-7" />
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent><p>Rejoindre la chaîne WhatsApp</p></TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    </motion.div>
                    <motion.div variants={fabItemVariants} custom={1} className="absolute bottom-0 right-0">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40">
                                                <HelpCircle className="h-7 w-7" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl">Guide d'utilisation</DialogTitle>
                                                <DialogDescription>
                                                    Suivez ces étapes pour optimiser vos gains.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Tabs defaultValue="app_guide">
                                                <TabsList className="grid w-full grid-cols-2">
                                                    <TabsTrigger value="app_guide">Guide de l'App</TabsTrigger>
                                                    <TabsTrigger value="strategy_guide">Stratégies de Jeu</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="app_guide" className="pt-4">
                                                    <div className="grid gap-6">
                                                        <GuideStep icon={<StepForward />} title="1. Choisissez votre risque" description="Sélectionnez un niveau de risque. Votre forfait détermine les niveaux auxquels vous avez accès."/>
                                                        <GuideStep icon={<Gamepad2 />} title="2. Saisissez l'historique" description="Copiez et collez l'historique des derniers crashs depuis votre jeu. Séparez les valeurs par un espace ou une virgule."/>
                                                        <GuideStep icon={<Target />} title="3. Lancez la prédiction" description="Cliquez sur 'Prédire'. Notre IA analysera les données et générera une liste de prédictions pour les minutes à venir."/>
                                                        <GuideStep icon={<Lightbulb />} title="4. Obtenez des stratégies" description="Cliquez sur une prédiction pour l'afficher en grand et obtenir des stratégies de pari (fonctionnalité premium)."/>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="strategy_guide" className="pt-4 max-h-[60vh] overflow-y-auto">
                                                <div className="space-y-4">
                                                    <StrategyGuideStep icon={<BrainCircuit />} title="1. Comprendre le principe"><p>Les jeux crash comme Aviator ou Lucky Jet fonctionnent sur un multiplicateur qui monte progressivement à partir de 1x. 🚀</p><p>Chaque tour commence avec une mise et le multiplicateur augmente jusqu’à ce qu’il "crash" de manière aléatoire. 💥</p><p>Ton objectif est de retirer avant que le multiplicateur s’effondre, sinon tu perds toute ta mise. 🎯</p><p>C’est un jeu de hasard pur, mais avec observation et timing, tu peux gérer ton risque. 👀</p><p>Le multiplicateur peut être très bas ou atteindre des valeurs très élevées (>10x). 📈</p><p>Comprendre ce mécanisme est la première étape avant de commencer à miser sérieusement. ✅</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<PiggyBank />} title="2. Commencer petit"><p>Avant de miser gros, teste toujours le jeu avec de petites mises. 🤏</p><p>Exemple : 200–500 FCFA par tour pour un capital initial de 50 000 FCFA. 💰</p><p>Cela te permet de comprendre la vitesse de montée du multiplicateur et le timing optimal du retrait. ⏱️</p><p>Les petits tours servent aussi à observer les tendances et le comportement du jeu. 📊</p><p>Tu peux noter combien de tours finissent en crash bas et combien atteignent un multiplicateur élevé. 📝</p><p>Commencer petit limite ton risque et t’apprend à jouer intelligemment.🧠</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Wallet />} title="3. Fixer un capital"><p>Détermine exactement combien tu es prêt à jouer pour une session. 🏦</p><p>Exemple : capital = 50 000 FCFA pour 1 journée de jeu. 📅</p><p>Ne dépasse jamais ce capital pour éviter de tout perdre sur une mauvaise série. 🚫</p><p>Divise ce capital en petites portions pour chaque tour afin de mieux contrôler les mises. 🍰</p><p>Cela t’évite de te retrouver à miser tout ton argent en une seule fois par frustration ou excès de confiance. 😤</p><p>Un capital clair permet de suivre tes gains et pertes plus efficacement. 📈</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<ShieldCheck />} title="4. Mise sécurisée"><p>Pour sécuriser tes gains, retire toujours à des multiplicateurs bas mais fiables. 🛡️</p><p>Exemple : mise 500 FCFA → retirer à 1,8x → gain 900 FCFA. ✅</p><p>Cela permet d’accumuler des profits constants même si les gros multiplicateurs restent rares. 📈</p><p>Cette stratégie est parfaite pour débuter et protéger ton capital. ⛑️</p><p>Elle réduit le stress, car tu n’as pas à courir après des jackpots risqués. 😌</p><p>Elle te permet aussi de tester différentes tendances sans mettre ton capital en danger. 👍</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<BarChart />} title="5. Retrait moyen"><p>Vise un multiplicateur intermédiaire pour un équilibre risque/gain. ⚖️</p><p>Exemple : mise 500 FCFA → retirer à 3x → gain 1 500 FCFA. 💰</p><p>C’est une stratégie pour ceux qui veulent un peu plus de profit sans prendre de gros risques. 😬</p><p>Elle fonctionne mieux si tu observes des tendances dans les multiplicateurs. 📊</p><p>Tu peux combiner ce retrait moyen avec des petites mises sécurisées pour diversifier tes gains. 🤝</p><p>C’est une étape intermédiaire avant d’attaquer les multiplicateurs élevés et risqués. ↗️</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<TrendingUp />} title="6. Retrait risqué"><p>Viser les multiplicateurs élevés (>5x) peut rapporter gros mais est très dangereux. 💣</p><p>Exemple : mise 500 FCFA → retirer à 10x → gain potentiel 5 000 FCFA. 🚀</p><p>Ne mise jamais plus de 5 % de ton capital pour ce type de pari. 💰</p><p>Utilise-le seulement pour des occasions où ton capital principal est déjà sécurisé. 🛡️</p><p>Cette stratégie doit être ponctuelle et réfléchie, jamais systématique. 🧠</p><p>Elle peut transformer une petite mise en jackpot mais peut aussi tout faire disparaître en un tour. 💨</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Wallet />} title="7. Gestion du capital"><p>Ne jamais risquer plus de 1–2 % du capital par tour. 💰</p><p>Si ton capital est de 50 000 FCFA, mise max 500–1 000 FCFA par tour. 💸</p><p>Cela permet de tenir plusieurs tours même en cas de pertes consécutives. 🛡️</p><p>Divise le capital en mini-pools pour gérer différentes stratégies en parallèle. 📊</p><p>Cette discipline protège ton capital contre l’adrénaline et l’émotion. 🧠</p><p>Une bonne gestion du capital est le cœur de toute stratégie efficace. ❤️</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<TrendingDown />} title="8. Martingale classique"><p>Martingale = double la mise après chaque perte pour récupérer les pertes précédentes. 📉</p><p>Exemple : tour 1 = 500 FCFA → perte, tour 2 = 1 000 FCFA → perte, tour 3 = 2 000 FCFA → gain. 💰</p><p>Cette technique peut récupérer rapidement tes pertes si tu as un capital suffisant. ✅</p><p>Mais attention : une longue série de pertes peut rapidement épuiser ton capital. ⚠️</p><p>C’est une stratégie risquée et à utiliser seulement avec un capital important. 🏦</p><p>Elle fonctionne mieux sur des multiplicateurs bas et réguliers. 👍</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Repeat />} title="9. Martingale modifiée"><p>Pour limiter le risque, ne double pas trop vite tes mises. 🐢</p><p>Exemple : 500 → 1 000 → 1 500 FCFA au lieu de doubler systématiquement. 🔢</p><p>Cette méthode permet de récupérer les pertes plus lentement, mais plus sûr. ✅</p><p>Elle te protège contre des crashes consécutifs élevés qui peuvent tout brûler. 🔥</p><p>Combine-la avec des retraits sécurisés pour limiter les pertes. 🤝</p><p>C’est une version plus prudente et adaptée aux petits capitales. 💡</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Sigma />} title="10. Fibonacci"><p>Augmente la mise selon la suite de Fibonacci après chaque perte : 500 → 500 → 1 000 → 1 500 → 2 500. 🔢</p><p>Après un gain, retourne à la mise initiale pour sécuriser ton capital. 🏦</p><p>C’est moins risqué que la martingale classique mais reste efficace pour récupérer des pertes. ✅</p><p>Idéal pour les joueurs qui observent les tendances et veulent une progression contrôlée. 🧠</p><p>Tu peux adapter la suite selon ton capital et tes objectifs. 🎯</p><p>C’est une stratégie solide pour gérer les séries de pertes. 👍</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<PieChart />} title="11. Mise fractionnelle"><p>Ne joue jamais ton capital entier sur un tour. 🍰</p><p>Mise seulement une fraction du gain potentiel que tu veux atteindre. 🎯</p><p>Exemple : capital 50 000 FCFA → mise = 10 % du gain visé. 💰</p><p>Cela limite la perte en cas de crash et te permet de jouer plus longtemps. ⏳</p><p>C’est parfait pour diversifier tes paris sur plusieurs multiplicateurs. 🌿</p><p>Tu gardes ainsi le contrôle de ton capital tout en cherchant de gros gains. 📈</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Waypoints />} title="12. Analyse des patterns"><p>Certains jeux affichent l’historique des multiplicateurs. 📜</p><p>Note les tendances : après plusieurs tours bas, un multiplicateur élevé est plus probable. 📊</p><p>Ne mise pas gros quand le multiplicateur reste constamment bas. 📉</p><p>Cherche les cycles ou répétitions qui peuvent influencer ton timing. 🔄</p><p>Ce n’est jamais garanti, mais l’observation augmente tes chances de gains. 👀</p><p>C’est un outil stratégique que beaucoup de joueurs ignorent. 🤫</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Goal />} title="13. Fixer un objectif"><p>Détermine un objectif clair par session, par exemple 10 000 FCFA de gains. 🎯</p><p>Une fois atteint, arrête de jouer pour sécuriser tes profits. 🏆</p><p>Cela évite de tout perdre par excès de confiance. 😌</p><p>Tu peux aussi définir des mini-objectifs pour suivre ta progression. 🚩</p><p>Cette discipline transforme un jeu aléatoire en session rentable. 🧠</p><p>Objectifs = motivation + limite psychologique pour contrôler le jeu. 🚧</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<StopCircle />} title="14. Plafond de perte"><p>Détermine combien tu es prêt à perdre par session, ex. 20 % du capital. 🛑</p><p>Une fois atteint, stop immédiat. ✋</p><p>Évite les pertes cumulées qui peuvent décourager et ruiner ton capital. 💸</p><p>Cela impose une discipline stricte et protège ton capital sur le long terme. 🛡️</p><p>Combine avec un objectif de gain pour équilibrer risque et profit. ⚖️</p><p>Ne jamais dépasser ton plafond = règle d’or. 📜</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<CloudFog />} title="15. Ne pas courir après les pertes"><p>Perdre plusieurs tours de suite peut déclencher l’adrénaline. 😡</p><p>Ne mise pas plus pour tenter de récupérer tes pertes rapidement. 💨</p><p>C’est la manière la plus rapide de tout perdre. 📉</p><p>Fais une pause ou reprends avec des mises sécurisées. 🧘</p><p>Apprendre à accepter les pertes est clé pour un jeu rentable. ✅</p><p>Le contrôle émotionnel est plus important que la stratégie technique. 🧠</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<PieChart />} title="16. Fractionner les mises"><p>Divise ton capital en plusieurs petites mises sur différents multiplicateurs. 🍰</p><p>Exemple : 50 000 FCFA → 5 mises de 1 000 FCFA + 10 mises de 500 FCFA. 💰</p><p>Cela te permet de sécuriser des gains constants tout en tentant des multiplicateurs élevés. 📈</p><p>Chaque mini-mise agit comme un pari indépendant. 🎲</p><p>Réduit le risque global et augmente tes chances de gains cumulés. ⚖️</p><p>C’est une technique que les pros utilisent pour gérer le capital efficacement. 🤓</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Target />} title="17. Timing du retrait"><p>Le timing est essentiel : retirer trop tôt = petits gains, trop tard = perte. ⏳</p><p>Observe la montée du multiplicateur et fixe un seuil cible par tour. 👀</p><p>Exemple : retirer à 1,8x pour sécuriser ou à 3x pour un peu plus de profit. 🎯</p><p>Adapte selon ton capital et ton objectif de gain. 🔧</p><p>Ne jamais baser le timing uniquement sur le feeling. 🧠</p><p>L’observation et l’expérience permettent de trouver le bon moment pour retirer. ✅</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Combine />} title="18. Combinaison des stratégies"><p>Ne te limite pas à une seule stratégie. 🤝</p><p>Combine retraits sécurisés, martingale modifiée et mises fractionnelles pour équilibrer risque et gain. ⚖️</p><p>Exemple : 70 % des mises sécurisées, 20 % en retrait moyen, 10 % en gros multiplicateur. 📊</p><p>Cela permet de rester rentable même si certains tours crashent. ✅</p><p>Tu diversifies tes paris comme un trader gère un portefeuille. 💼</p><p>La combinaison est plus efficace qu’une seule stratégie isolée. 🏆</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Trophy />} title="19. Profiter des bonus"><p>Beaucoup de casinos offrent bonus, free bets ou tours gratuits. 🎁</p><p>Exemple : 10 % bonus sur dépôt = capital supplémentaire à jouer sans risque réel. 💰</p><p>Cela permet de tester des stratégies ou multiplier tes gains. 📈</p><p>Lis toujours les conditions pour ne pas te retrouver piégé. 📜</p><p>Les bonus peuvent transformer une session moyenne en session rentable. ✨</p><p>C’est une ressource sous-utilisée par la plupart des joueurs. 🤫</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<BarChart />} title="20. Suivi des gains"><p>Note chaque tour : mise, multiplicateur, gain/perte. 📝</p><p>Exemple : tableau Excel pour suivre les résultats en FCFA. 📊</p><p>Tu verras les patterns et l’efficacité de tes stratégies. 👀</p><p>Cela permet d’ajuster ton approche en temps réel. 🔧</p><p>Le suivi rend le jeu moins aléatoire et plus scientifique. 🧪</p><p>C’est la base pour évoluer vers un joueur discipliné et rentable. 👨‍🏫</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<ShieldCheck />} title="21. Discipline"><p>Respecte strictement limites de mise, plafond de perte et objectifs de gain. 📜</p><p>Ne change jamais de stratégie sous l’effet des émotions. 🧘</p><p>Les joueurs impulsifs perdent rapidement tout leur capital. 💸</p><p>La discipline est plus importante que la chance. 🧠</p><p>Établir des règles avant de jouer te protège de l’excès de confiance. 🛡️</p><p>Elle transforme un jeu de hasard en jeu géré et stratégique. ♟️</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<PauseCircle />} title="22. Pauses régulières"><p>Jouer fatigué = décisions mauvaises = pertes assurées. 😴</p><p>Fais des pauses toutes les 15–30 minutes pour rester lucide. ☕</p><p>Profite-en pour analyser les tours précédents et ajuster tes stratégies. 📊</p><p>Respire, éloigne-toi de l’écran et reviens avec un esprit clair. 🌬️</p><p>Les pros ne jouent jamais en continu sans repos. 🚫</p><p>Le mental est ton meilleur allié pour maximiser tes gains. 💪</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<BrainCircuit />} title="23. Mental fort"><p>Reste calme face aux pertes et aux gains rapides. 🧘‍♂️</p><p>Ne laisse pas l’adrénaline influencer tes décisions. 😤</p><p>Accepte que le hasard fera toujours partie du jeu. ✅</p><p>La constance mentale permet de rester rentable sur le long terme. 📈</p><p>Prends des notes, analyse, ajuste et continue avec discipline. 📝</p><p>Le mental fort fait la différence entre un joueur chanceux et un joueur rentable. 🏆</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Wrench />} title="24. Ajuster la stratégie"><p>Ne reste pas bloqué sur une méthode qui ne fonctionne pas. 🔄</p><p>Observe, teste, corrige et adapte ton approche. 🧠</p><p>Exemple : réduire multiplicateur cible si les crashes arrivent trop tôt. 📉</p><p>Changer la taille des mises selon la série de gains ou pertes. 💰</p><p>La flexibilité est un atout majeur dans les jeux de hasard. 🤸‍♂️</p><p>Un joueur qui s’adapte survivra plus longtemps et fera plus de profits. ✅</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<TableIcon />} title="25. Exemple concret en FCFA"><pre className="font-mono text-xs whitespace-pre-wrap bg-background/50 p-2 rounded-md">{`Tour | Mise  | Multiplicateur cible | Gain potentiel          | Action
-----|-------|----------------------|-------------------------|------------------------------
1    | 500   | 1,8x                 | 900                     | Retirer tôt
2    | 500   | 2,5x                 | 1 250                   | Retirer moyen
3    | 500   | 5x                   | 2 500                   | Retirer à 3x → 1 500
4    | 200   | 10x                  | 2 000                   | Risqué
5    | 1000  | 1,5x                 | 1 500                   | Retirer tôt`}</pre><p className="mt-2">Chaque tour doit être planifié. Note les résultats, ajuste et reste discipliné pour maximiser les gains et transformer un jeu aléatoire en jeu stratégique.</p></StrategyGuideStep>
                                                    <StrategyGuideStep icon={<Trophy />} title="Conclusion"><p>Les jeux crash restent des jeux de hasard, mais une stratégie disciplinée, un capital bien géré et un mental fort permettent de maximiser les gains et limiter les pertes. 🧠🛡️🏆</p><p>Points clés : commence petit, sécurise tes gains, fixe tes limites, note et analyse chaque session. ✅</p><p>La patience et la discipline sont plus puissantes que la chance. 💪</p><p>Combine plusieurs stratégies, observe les patterns, profite des bonus et prends des pauses régulières. 🔄👀🎁🧘‍♂️</p><p>Avec cette approche, tu passes d’un joueur impulsif à un joueur réfléchi, rentable et durable. 👨‍🏫</p><p>Ton capital devient un outil pour générer des gains réguliers, tout en minimisant le risque de tout perdre. 📈</p></StrategyGuideStep>
                                                </div>
                                                </TabsContent>
                                            </Tabs>
                                        </DialogContent>
                                    </Dialog>
                                </TooltipTrigger>
                                <TooltipContent><p>Guide d'utilisation</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </motion.div>
                    <motion.div variants={fabItemVariants} custom={0} className="absolute bottom-0 right-0">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href="https://t.me/Jet_Predict_Bot" target="_blank" rel="noopener noreferrer">
                                        <Button className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-blue-500/40">
                                            <TelegramIcon className="h-7 w-7" />
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent><p>Ouvrir le bot Telegram</p></TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className="relative h-16 w-16 rounded-full bg-foreground text-background shadow-lg shadow-black/30 dark:shadow-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
        >
            <motion.div
                animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <Plus size={32} />
            </motion.div>
        </motion.button>
    </motion.div>
    </div>
  );
}
