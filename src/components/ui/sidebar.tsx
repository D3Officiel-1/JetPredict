
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { app, db, requestForToken, onMessageListener } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Beaker, Bell, LifeBuoy, Users, ShieldAlert, HelpCircle, Compass, X, Wallet, Rocket, Gamepad2, TrendingUp, HandCoins, CheckCircle, LineChart, Target, PictureInPicture, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const GuideStep = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-1 border border-primary/20">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

const StrategyItem = ({ icon, title, description, isLast = false }: { icon: React.ReactNode; title: string; description: string | React.ReactNode; isLast?: boolean; }) => (
    <AccordionItem value={title} className={cn("border-b-0", !isLast && "mb-2")}>
        <AccordionTrigger className="p-4 bg-muted/30 border border-border/30 rounded-lg hover:bg-muted/50 hover:no-underline transition-colors group">
            <div className="flex items-center gap-4 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border-2 border-primary/30 transition-colors group-hover:border-primary/50 group-hover:bg-primary/20">{icon}</div>
                <h3 className="font-semibold text-foreground flex-1">{title}</h3>
            </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 text-sm text-muted-foreground whitespace-pre-line">
            {description}
        </AccordionContent>
    </AccordionItem>
);


const fabVariants = {
  closed: { scale: 1, rotate: 0 },
  open: { scale: 1, rotate: 45 },
};

const menuContainerVariants = {
  closed: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};


const menuItemVariants = {
  closed: { opacity: 0, y: 20, scale: 0.8 },
  open: { opacity: 1, y: 0, scale: 1 },
};

const FABMenuItem = ({
  icon,
  label,
  href,
  onClick,
  disabled = false,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}) => {
    
    const Wrapper = href && !disabled ? Link : 'button';
    const props = href && !disabled ? { href, target: "_blank", rel: "noopener noreferrer" } : { onClick: disabled ? () => {} : onClick, disabled };
    
    return (
        <motion.div variants={menuItemVariants} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Wrapper
                            {...props}
                            className={cn(
                                "h-14 w-14 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            )}
                        >
                           {icon}
                        </Wrapper>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>{disabled ? tooltip : label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </motion.div>
    );
};


export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ username?: string, solde_referral?: number } | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [isFabDisabled, setIsFabDisabled] = useState(false);

  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
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

  useEffect(() => {
    const handleFabStateChange = () => {
        try {
            const savedStateRaw = localStorage.getItem('fabState');
            if (savedStateRaw) {
                const parsedState = JSON.parse(savedStateRaw);
                setIsFabDisabled(!!parsedState.isDisabled);
            }
        } catch (e) {
            console.error("Failed to read FAB state on change", e);
        }
    };
    
    // Initial load
    handleFabStateChange();

    window.addEventListener('fabstate-change', handleFabStateChange);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;
      setUser(currentUser);

      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
              setUserData(doc.data());
          }
      });

      const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
      const unsubscribePricing = onSnapshot(pricingDocRef, (doc) => {
          if (doc.exists()) {
              setPlanId(doc.data().idplan_jetpredict);
          }
      });

      const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
      const q = query(notificationsRef, where('isRead', '==', false));
      const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          setUnreadCount(snapshot.size);
      });

      return () => {
          unsubscribeUser();
          unsubscribePricing();
          unsubscribeNotifications();
      };
    });

    return () => {
        unsubscribeAuth();
        window.removeEventListener('fabstate-change', handleFabStateChange);
    };
  }, [auth]);

  const handleLogout = async () => {
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false });
    }
    await signOut(auth);
    router.push('/login');
  };

  const getInitials = (email: string | null | undefined) => {
    if (userData?.username) return userData.username.substring(0, 2).toUpperCase();
    if (user?.displayName) return user.displayName.substring(0, 2).toUpperCase();
    return email ? email.substring(0, 2).toUpperCase() : '??';
  };

  const isVerified = user?.emailVerified === true;
  const canAccessPremiumFeatures = planId === 'weekly' || planId === 'monthly';
  const canAccessSupport = planId === 'monthly';
  
  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 cursor-pointer group rounded-full p-1 pr-3 transition-colors hover:bg-muted">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-primary/30 group-hover:border-primary/70 transition-colors">
                            <AvatarImage src={user.photoURL ?? ''} alt="Avatar" />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                         {unreadCount > 0 && <span className="premium-notification-pulse"></span>}
                         {!isVerified && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-destructive ring-2 ring-background" />}
                    </div>
                     <div className="hidden sm:flex flex-col items-start">
                        <span className="font-bold text-sm text-foreground truncate max-w-[120px]">{userData?.username || user.displayName || 'Utilisateur'}</span>
                        <span className="text-xs text-muted-foreground">Mon Compte</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                className="w-64 bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/10" 
                align="start" 
                forceMount
            >
              <div className="p-2">
                <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL ?? ''} alt="Avatar" />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 overflow-hidden">
                            <p className="text-sm font-medium leading-none truncate">{userData?.username || user.displayName || 'Mon Compte'}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                {!isVerified && (
                    <DropdownMenuItem asChild>
                    <Link href="/verify-email" className="text-destructive focus:bg-destructive/10 focus:text-destructive m-1">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        <span>Email non vérifié</span>
                    </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-2 bg-border/50" />
                {pathname !== '/predict' && <DropdownMenuItem asChild disabled={!isVerified}><Link href="/predict"><Rocket className="mr-2 h-4 w-4" /><span>Prédiction</span></Link></DropdownMenuItem>}
                {pathname !== '/notification' && <DropdownMenuItem asChild disabled={!isVerified}><Link href="/notification"><Bell className="mr-2 h-4 w-4" /><span>Notifications</span>{unreadCount > 0 && <span className="notification-dot"></span>}</Link></DropdownMenuItem>}
                {pathname !== '/profile' && <DropdownMenuItem asChild disabled={!isVerified}><Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /><span>Profil</span></Link></DropdownMenuItem>}
                {pathname !== '/referral' && <DropdownMenuItem asChild disabled={!isVerified}><Link href="/referral"><Users className="mr-2 h-4 w-4" /><span>Parrainage</span></Link></DropdownMenuItem>}
                {pathname !== '/simulation' && <DropdownMenuItem asChild disabled={!isVerified || !canAccessPremiumFeatures}><Link href="/simulation"><Beaker className="mr-2 h-4 w-4" /><span>Simulation</span></Link></DropdownMenuItem>}
                {pathname !== '/settings' && <DropdownMenuItem asChild disabled={!isVerified}><Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>Paramètres</span></Link></DropdownMenuItem>}
                {pathname !== '/support' && <DropdownMenuItem asChild disabled={!isVerified || !canAccessSupport}><Link href="/support"><LifeBuoy className="mr-2 h-4 w-4" /><span>Support</span></Link></DropdownMenuItem>}
                <DropdownMenuSeparator className="my-2 bg-border/50"/>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-500/10 focus:text-red-400"><LogOut className="mr-2 h-4 w-4" /><span>Se déconnecter</span></DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Link href="/predict" className="group">
                 <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={40} height={40} className="h-10 w-auto rounded-md transition-transform duration-300 group-hover:scale-110" />
            </Link>
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                     <Wallet className="h-5 w-5 text-green-400" />
                     <span className="font-bold text-sm text-foreground">{(userData?.solde_referral || 0).toLocaleString('fr-FR')} F</span>
                  </div>
              </TooltipTrigger>
              <TooltipContent><p>Solde Parrainage</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      <AnimatePresence>
        {!isFabDisabled && (
          <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="relative flex flex-col items-center gap-4"
              initial={false}
              animate={isFabMenuOpen ? "open" : "closed"}
            >
              <AnimatePresence>
                {isFabMenuOpen && (
                  <motion.div
                    variants={menuContainerVariants}
                    className="absolute bottom-20 flex flex-col items-center gap-4"
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <FABMenuItem icon={<Image src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Blue_Question_Circle.svg" alt="Guide" width={56} height={56} />} label="Guide" onClick={() => setIsGuideOpen(true)} />
                    <FABMenuItem icon={<Image src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width={56} height={56} />} label="WhatsApp" href="https://www.whatsapp.com/channel/0029VbBc22V4yltHAKWD0R2x" />
                    <FABMenuItem icon={<Image src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" width={56} height={56} />} label="Telegram" href="https://t.me/Predict_D3officiel" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                variants={fabVariants}
                className="relative h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
                onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                  <Compass size={32} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
            <DialogContent className="max-w-3xl h-[90vh] max-h-[700px] flex flex-col bg-card/80 backdrop-blur-lg border-primary/20 shadow-2xl shadow-primary/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tighter">PROTOCOLES DE JEU</DialogTitle>
                     <DialogDescription>
                        Maîtrisez les stratégies pour optimiser vos gains.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="guide" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="guide">Guide d'utilisation</TabsTrigger>
                        <TabsTrigger value="how-to">Comment Jouer</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 overflow-y-auto mt-4 pr-3 -mr-6">
                        <TabsContent value="guide" className="pt-2">
                           <div className="space-y-6">
                                <GuideStep
                                    icon={<TrendingUp />}
                                    title="1. Le Tableau de Bord"
                                    description={
                                        <span>
                                            Choisissez un <strong>Niveau de Risque</strong> (Faible, Modéré, etc.) pour ajuster le type de prédictions. Ensuite, dans la zone de texte, collez l'<strong>historique des crashs</strong> récents (ex: 1.23 4.56 2.01). Cliquez sur le bouton <strong>"Prédire"</strong> pour lancer l'analyse IA.
                                        </span>
                                    }
                                />
                                <GuideStep
                                    icon={<Target />}
                                    title="2. Les Prédictions"
                                    description={
                                        <span>
                                            Les résultats apparaissent dans la carte "Prochaines Prédictions". Chaque ligne indique une <strong>heure estimée</strong> et une <strong>cote prédite</strong>. Cliquez sur une prédiction pour voir plus de détails. Utilisez le bouton <strong>Copier</strong> pour partager la liste, ou <strong>Superposer</strong> (premium) pour afficher une fenêtre flottante.
                                        </span>
                                    }
                                />
                                <GuideStep
                                    icon={<BrainCircuit />}
                                    title="3. Stratégies de l'IA"
                                    description={
                                        <span>
                                            En cliquant sur une prédiction, une fenêtre s'ouvre. Si vous avez un forfait premium, l'IA générera deux stratégies : une <strong>Conservatrice</strong> pour sécuriser des gains, et une <strong>Agressive</strong> pour viser plus haut. Ces conseils vous aident à décider comment parier.
                                        </span>
                                    }
                                />
                                <GuideStep
                                    icon={<LineChart />}
                                    title="4. Le Graphique"
                                    description="Le graphique vous donne une vue d'ensemble visuelle de toutes les cotes prédites dans le temps. Survolez les points pour voir les valeurs exactes. C'est un excellent outil pour repérer rapidement les pics de cotes (les opportunités les plus rentables)."
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="how-to" className="pt-2">
                             <Accordion type="single" collapsible className="w-full space-y-2">
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">1</span>}
                                    title="Comprendre le principe"
                                    description={`Les jeux crash comme Aviator ou Lucky Jet fonctionnent sur un multiplicateur qui monte progressivement à partir de 1x.\nChaque tour commence avec une mise et le multiplicateur augmente jusqu’à ce qu’il "crash" de manière aléatoire.\nTon objectif est de retirer avant que le multiplicateur s’effondre, sinon tu perds toute ta mise.\nC’est un jeu de hasard pur, mais avec observation et timing, tu peux gérer ton risque.\nLe multiplicateur peut être très bas ou atteindre des valeurs très élevées (>10x).\nComprendre ce mécanisme est la première étape avant de commencer à miser sérieusement.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">2</span>}
                                    title="Commencer petit"
                                    description={`Avant de miser gros, teste toujours le jeu avec de petites mises.\nExemple : 200–500 FCFA par tour pour un capital initial de 50 000 FCFA.\nCela te permet de comprendre la vitesse de montée du multiplicateur et le timing optimal du retrait.\nLes petits tours servent aussi à observer les tendances et le comportement du jeu.\nTu peux noter combien de tours finissent en crash bas et combien atteignent un multiplicateur élevé.\nCommencer petit limite ton risque et t’apprend à jouer intelligemment.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">3</span>}
                                    title="Fixer un capital"
                                    description={`Détermine exactement combien tu es prêt à jouer pour une session.\nExemple : capital = 50 000 FCFA pour 1 journée de jeu.\nNe dépasse jamais ce capital pour éviter de tout perdre sur une mauvaise série.\nDivise ce capital en petites portions pour chaque tour afin de mieux contrôler les mises.\nCela t’évite de te retrouver à miser tout ton argent en une seule fois par frustration ou excès de confiance.\nUn capital clair permet de suivre tes gains et pertes plus efficacement.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">4</span>}
                                    title="Mise sécurisée"
                                    description={`Pour sécuriser tes gains, retire toujours à des multiplicateurs bas mais fiables.\nExemple : mise 500 FCFA → retirer à 1,8x → gain 900 FCFA.\nCela permet d’accumuler des profits constants même si les gros multiplicateurs restent rares.\nCette stratégie est parfaite pour débuter et protéger ton capital.\nElle réduit le stress, car tu n’as pas à courir après des jackpots risqués.\nElle te permet aussi de tester différentes tendances sans mettre ton capital en danger.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">5</span>}
                                    title="Retrait moyen"
                                    description={`Vise un multiplicateur intermédiaire pour un équilibre risque/gain.\nExemple : mise 500 FCFA → retirer à 3x → gain 1 500 FCFA.\nC’est une stratégie pour ceux qui veulent un peu plus de profit sans prendre de gros risques.\nElle fonctionne mieux si tu observes des tendances dans les multiplicateurs.\nTu peux combiner ce retrait moyen avec des petites mises sécurisées pour diversifier tes gains.\nC’est une étape intermédiaire avant d’attaquer les multiplicateurs élevés et risqués.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">6</span>}
                                    title="Retrait risqué"
                                    description={`Viser les multiplicateurs élevés (>5x) peut rapporter gros mais est très dangereux.\nExemple : mise 500 FCFA → retirer à 10x → gain potentiel 5 000 FCFA.\nNe mise jamais plus de 5 % de ton capital pour ce type de pari.\nUtilise-le seulement pour des occasions où ton capital principal est déjà sécurisé.\nCette stratégie doit être ponctuelle et réfléchie, jamais systématique.\nElle peut transformer une petite mise en jackpot mais peut aussi tout faire disparaître en un tour.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">7</span>}
                                    title="Gestion du capital"
                                    description={`Ne jamais risquer plus de 1–2 % du capital par tour.\nSi ton capital est de 50 000 FCFA, mise max 500–1 000 FCFA par tour.\nCela permet de tenir plusieurs tours même en cas de pertes consécutives.\nDivise le capital en mini-pools pour gérer différentes stratégies en parallèle.\nCette discipline protège ton capital contre l’adrénaline et l’émotion.\nUne bonne gestion du capital est le cœur de toute stratégie efficace.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">8</span>}
                                    title="Martingale classique"
                                    description={`Martingale = double la mise après chaque perte pour récupérer les pertes précédentes.\nExemple : tour 1 = 500 FCFA → perte, tour 2 = 1 000 FCFA → perte, tour 3 = 2 000 FCFA → gain.\nCette technique peut récupérer rapidement tes pertes si tu as un capital suffisant.\nMais attention : une longue série de pertes peut rapidement épuiser ton capital.\nC’est une stratégie risquée et à utiliser seulement avec un capital important.\nElle fonctionne mieux sur des multiplicateurs bas et réguliers.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">9</span>}
                                    title="Martingale modifiée"
                                    description={`Pour limiter le risque, ne double pas trop vite tes mises.\nExemple : 500 → 1 000 → 1 500 FCFA au lieu de doubler systématiquement.\nCette méthode permet de récupérer les pertes plus lentement, mais plus sûr.\nElle te protège contre des crashes consécutifs élevés qui peuvent tout brûler.\nCombine-la avec des retraits sécurisés pour limiter les pertes.\nC’est une version plus prudente et adaptée aux petits capitales.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">10</span>}
                                    title="Fibonacci"
                                    description={`Augmente la mise selon la suite de Fibonacci après chaque perte : 500 → 500 → 1 000 → 1 500 → 2 500.\nAprès un gain, retourne à la mise initiale pour sécuriser ton capital.\nC’est moins risqué que la martingale classique mais reste efficace pour récupérer des pertes.\nIdéal pour les joueurs qui observent les tendances et veulent une progression contrôlée.\nTu peux adapter la suite selon ton capital et tes objectifs.\nC’est une stratégie solide pour gérer les séries de pertes.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">11</span>}
                                    title="Mise fractionnelle"
                                    description={`Ne joue jamais ton capital entier sur un tour.\nMise seulement une fraction du gain potentiel que tu veux atteindre.\nExemple : capital 50 000 FCFA → mise = 10 % du gain visé.\nCela limite la perte en cas de crash et te permet de jouer plus longtemps.\nC’est parfait pour diversifier tes paris sur plusieurs multiplicateurs.\nTu gardes ainsi le contrôle de ton capital tout en cherchant de gros gains.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">12</span>}
                                    title="Analyse des patterns"
                                    description={`Certains jeux affichent l’historique des multiplicateurs.\nNote les tendances : après plusieurs tours bas, un multiplicateur élevé est plus probable.\nNe mise pas gros quand le multiplicateur reste constamment bas.\nCherche les cycles ou répétitions qui peuvent influencer ton timing.\nCe n’est jamais garanti, mais l’observation augmente tes chances de gains.\nC’est un outil stratégique que beaucoup de joueurs ignorent.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">13</span>}
                                    title="Fixer un objectif"
                                    description={`Détermine un objectif clair par session, par exemple 10 000 FCFA de gains.\nUne fois atteint, arrête de jouer pour sécuriser tes profits.\nCela évite de tout perdre par excès de confiance.\nTu peux aussi définir des mini-objectifs pour suivre ta progression.\nCette discipline transforme un jeu aléatoire en session rentable.\nObjectifs = motivation + limite psychologique pour contrôler le jeu.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">14</span>}
                                    title="Plafond de perte"
                                    description={`Détermine combien tu es prêt à perdre par session, ex. 20 % du capital.\nUne fois atteint, stop immédiat.\nÉvite les pertes cumulées qui peuvent décourager et ruiner ton capital.\nCela impose une discipline stricte et protège ton capital sur le long terme.\nCombine avec un objectif de gain pour équilibrer risque et profit.\nNe jamais dépasser ton plafond = règle d’or.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">15</span>}
                                    title="Ne pas courir après les pertes"
                                    description={`Perdre plusieurs tours de suite peut déclencher l’adrénaline.\nNe mise pas plus pour tenter de récupérer tes pertes rapidement.\nC’est la manière la plus rapide de tout perdre.\nFais une pause ou reprends avec des mises sécurisées.\nApprendre à accepter les pertes est clé pour un jeu rentable.\nLe contrôle émotionnel est plus important que la stratégie technique.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">16</span>}
                                    title="Fractionner les mises"
                                    description={`Divise ton capital en plusieurs petites mises sur différents multiplicateurs.\nExemple : 50 000 FCFA → 5 mises de 1 000 FCFA + 10 mises de 500 FCFA.\nCela te permet de sécuriser des gains constants tout en tentant des multiplicateurs élevés.\nChaque mini-mise agit comme un pari indépendant.\nRéduit le risque global et augmente tes chances de gains cumulés.\nC’est une technique que les pros utilisent pour gérer le capital efficacement.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">17</span>}
                                    title="Timing du retrait"
                                    description={`Le timing est essentiel : retirer trop tôt = petits gains, trop tard = perte.\nObserve la montée du multiplicateur et fixe un seuil cible par tour.\nExemple : retirer à 1,8x pour sécuriser ou à 3x pour un peu plus de profit.\nAdapte selon ton capital et ton objectif de gain.\nNe jamais baser le timing uniquement sur le feeling.\nL’observation et l’expérience permettent de trouver le bon moment pour retirer.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">18</span>}
                                    title="Combinaison des stratégies"
                                    description={`Ne te limite pas à une seule stratégie.\nCombine retraits sécurisés, martingale modifiée et mises fractionnelles pour équilibrer risque et gain.\nExemple : 70 % des mises sécurisées, 20 % en retrait moyen, 10 % en gros multiplicateur.\nCela permet de rester rentable même si certains tours crashent.\nTu diversifies tes paris comme un trader gère un portefeuille.\nLa combinaison est plus efficace qu’une seule stratégie isolée.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">19</span>}
                                    title="Profiter des bonus"
                                    description={`Beaucoup de casinos offrent bonus, free bets ou tours gratuits.\nExemple : 10 % bonus sur dépôt = capital supplémentaire à jouer sans risque réel.\nCela permet de tester des stratégies ou multiplier tes gains.\nLis toujours les conditions pour ne pas te retrouver piégé.\nLes bonus peuvent transformer une session moyenne en session rentable.\nC’est une ressource sous-utilisée par la plupart des joueurs.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">20</span>}
                                    title="Suivi des gains"
                                    description={`Note chaque tour : mise, multiplicateur, gain/perte.\nExemple : tableau Excel pour suivre les résultats en FCFA.\nTu verras les patterns et l’efficacité de tes stratégies.\nCela permet d’ajuster ton approche en temps réel.\nLe suivi rend le jeu moins aléatoire et plus scientifique.\nC’est la base pour évoluer vers un joueur discipliné et rentable.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">21</span>}
                                    title="Discipline"
                                    description={`Respecte strictement limites de mise, plafond de perte et objectifs de gain.\nNe change jamais de stratégie sous l’effet des émotions.\nLes joueurs impulsifs perdent rapidement tout leur capital.\nLa discipline est plus importante que la chance.\nÉtablir des règles avant de jouer te protège de l’excès de confiance.\nElle transforme un jeu de hasard en jeu géré et stratégique.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">22</span>}
                                    title="Pauses régulières"
                                    description={`Jouer fatigué = décisions mauvaises = pertes assurées.\nFais des pauses toutes les 15–30 minutes pour rester lucide.\nProfite-en pour analyser les tours précédents et ajuster tes stratégies.\nRespire, éloigne-toi de l’écran et reviens avec un esprit clair.\nLes pros ne jouent jamais en continu sans repos.\nLe mental est ton meilleur allié pour maximiser tes gains.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">23</span>}
                                    title="Mental fort"
                                    description={`Reste calme face aux pertes et aux gains rapides.\nNe laisse pas l’adrénaline influencer tes décisions.\nAccepte que le hasard fera toujours partie du jeu.\nLa constance mentale permet de rester rentable sur le long terme.\nPrends des notes, analyse, ajuste et continue avec discipline.\nLe mental fort fait la différence entre un joueur chanceux et un joueur rentable.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">24</span>}
                                    title="Ajuster la stratégie"
                                    description={`Ne reste pas bloqué sur une méthode qui ne fonctionne pas.\nObserve, teste, corrige et adapte ton approche.\nExemple : réduire multiplicateur cible si les crashes arrivent trop tôt.\nChanger la taille des mises selon la série de gains ou pertes.\nLa flexibilité est un atout majeur dans les jeux de hasard.\nUn joueur qui s’adapte survivra plus longtemps et fera plus de profits.`}
                                />
                                <StrategyItem
                                    icon={<span className="font-bold text-lg">25</span>}
                                    title="Exemple concret en FCFA"
                                    description={
                                        <div>
                                            <div className="font-mono text-xs bg-background/50 p-4 rounded-lg overflow-x-auto">
                                                <div className="grid grid-cols-5 gap-x-2 gap-y-1 text-center font-semibold text-muted-foreground border-b border-border/50 pb-2 mb-2">
                                                    <div>Tour</div>
                                                    <div>Mise</div>
                                                    <div>Cible</div>
                                                    <div className="text-right">Gain Pot.</div>
                                                    <div className="text-left">Action</div>
                                                </div>
                                                <div className="grid grid-cols-5 gap-x-2 gap-y-2 text-center items-center">
                                                    <div>1</div><div>500</div><div>1,8x</div><div className="text-right">900</div><div className="text-left text-green-400">Retirer tôt</div>
                                                    <div>2</div><div>500</div><div>2,5x</div><div className="text-right">1 250</div><div className="text-left text-blue-400">Retirer moyen</div>
                                                    <div>3</div><div>500</div><div>5x</div><div className="text-right">1 500</div><div className="text-left text-blue-400">Retirer à 3x</div>
                                                    <div>4</div><div>200</div><div>10x</div><div className="text-right">2 000</div><div className="text-left text-orange-400">Risqué</div>
                                                    <div>5</div><div>1 000</div><div>1,5x</div><div className="text-right">1 500</div><div className="text-left text-green-400">Retirer tôt</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <p>Chaque tour doit être planifié selon ton capital, ton objectif et ton niveau de risque.</p>
                                                <p>Note les résultats, ajuste et reste discipliné pour maximiser les gains.</p>
                                                <p>Avec cette méthode, tu transformes un jeu aléatoire en jeu stratégique et rentable.</p>
                                            </div>
                                        </div>
                                    }
                                />
                                <StrategyItem
                                    icon={<CheckCircle />}
                                    title="Conclusion"
                                    description={`Les jeux crash restent des jeux de hasard, mais une stratégie disciplinée, un capital bien géré et un mental fort permettent de maximiser les gains et limiter les pertes.\nPoints clés : commence petit, sécurise tes gains, fixe tes limites, note et analyse chaque session.\nLa patience et la discipline sont plus puissantes que la chance.\nCombine plusieurs stratégies, observe les patterns, profite des bonus et prends des pauses régulières.\nAvec cette approche, tu passes d’un joueur impulsif à un joueur réfléchi, rentable et durable.\nTon capital devient un outil pour générer des gains réguliers, tout en minimisant le risque de tout perdre.`}
                                    isLast={true}
                                />
                            </Accordion>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    </>
  );
}
