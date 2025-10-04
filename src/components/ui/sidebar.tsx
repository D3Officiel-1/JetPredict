
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
import { LogOut, Settings, User as UserIcon, Beaker, Bell, LifeBuoy, Users, ShieldAlert, HelpCircle, Compass, X, Wallet, Rocket, Gamepad2, TrendingUp, HandCoins, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

const StrategyItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string | React.ReactNode }) => (
    <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{icon}</span>
            {title}
        </h3>
        <div className="text-sm text-muted-foreground whitespace-pre-line">
            {description}
        </div>
    </div>
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
            <DialogContent className="max-w-md h-[400px] sm:h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Guide</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="guide" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="guide">Guide d'utilisation</TabsTrigger>
                        <TabsTrigger value="how-to">Comment Jouer</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 overflow-y-auto mt-4 pr-2 -mr-4 sm:-mr-6">
                        <TabsContent value="guide" className="pt-2">
                            <div className="space-y-6">
                                <GuideStep
                                    icon={<Users />}
                                    title="1. Niveaux de Risque"
                                    description="Choisissez un niveau de risque. Plus le risque est élevé, plus les cotes sont hautes mais espacées dans le temps."
                                />
                                <GuideStep
                                    icon={<Wallet />}
                                    title="2. Historique des Crashs"
                                    description="Saisissez l'historique des derniers multiplicateurs de crash, séparés par un espace. Plus il y a de données, plus l'IA est précise."
                                />
                                <GuideStep
                                    icon={<Beaker />}
                                    title="3. Lancez la Prédiction"
                                    description="Cliquez sur 'Prédire'. L'IA analyse les données et génère une liste de cotes potentielles avec leurs heures estimées."
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="how-to" className="pt-2 space-y-4">
                           <StrategyItem
                                icon={<span className="font-bold text-lg">1</span>}
                                title="Comprendre le principe"
                                description={`Les jeux crash comme Aviator ou Lucky Jet fonctionnent sur un multiplicateur qui monte progressivement à partir de 1x.
Chaque tour commence avec une mise et le multiplicateur augmente jusqu’à ce qu’il "crash" de manière aléatoire.
Ton objectif est de retirer avant que le multiplicateur s’effondre, sinon tu perds toute ta mise.
C’est un jeu de hasard pur, mais avec observation et timing, tu peux gérer ton risque.
Le multiplicateur peut être très bas ou atteindre des valeurs très élevées (>10x).
Comprendre ce mécanisme est la première étape avant de commencer à miser sérieusement.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">2</span>}
                                title="Commencer petit"
                                description={`Avant de miser gros, teste toujours le jeu avec de petites mises.
Exemple : 200–500 FCFA par tour pour un capital initial de 50 000 FCFA.
Cela te permet de comprendre la vitesse de montée du multiplicateur et le timing optimal du retrait.
Les petits tours servent aussi à observer les tendances et le comportement du jeu.
Tu peux noter combien de tours finissent en crash bas et combien atteignent un multiplicateur élevé.
Commencer petit limite ton risque et t’apprend à jouer intelligemment.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">3</span>}
                                title="Fixer un capital"
                                description={`Détermine exactement combien tu es prêt à jouer pour une session.
Exemple : capital = 50 000 FCFA pour 1 journée de jeu.
Ne dépasse jamais ce capital pour éviter de tout perdre sur une mauvaise série.
Divise ce capital en petites portions pour chaque tour afin de mieux contrôler les mises.
Cela t’évite de te retrouver à miser tout ton argent en une seule fois par frustration ou excès de confiance.
Un capital clair permet de suivre tes gains et pertes plus efficacement.`}
                            />
                             <StrategyItem
                                icon={<span className="font-bold text-lg">4</span>}
                                title="Mise sécurisée"
                                description={`Pour sécuriser tes gains, retire toujours à des multiplicateurs bas mais fiables.
Exemple : mise 500 FCFA → retirer à 1,8x → gain 900 FCFA.
Cela permet d’accumuler des profits constants même si les gros multiplicateurs restent rares.
Cette stratégie est parfaite pour débuter et protéger ton capital.
Elle réduit le stress, car tu n’as pas à courir après des jackpots risqués.
Elle te permet aussi de tester différentes tendances sans mettre ton capital en danger.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">5</span>}
                                title="Retrait moyen"
                                description={`Vise un multiplicateur intermédiaire pour un équilibre risque/gain.
Exemple : mise 500 FCFA → retirer à 3x → gain 1 500 FCFA.
C’est une stratégie pour ceux qui veulent un peu plus de profit sans prendre de gros risques.
Elle fonctionne mieux si tu observes des tendances dans les multiplicateurs.
Tu peux combiner ce retrait moyen avec des petites mises sécurisées pour diversifier tes gains.
C’est une étape intermédiaire avant d’attaquer les multiplicateurs élevés et risqués.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">6</span>}
                                title="Retrait risqué"
                                description={`Viser les multiplicateurs élevés (>5x) peut rapporter gros mais est très dangereux.
Exemple : mise 500 FCFA → retirer à 10x → gain potentiel 5 000 FCFA.
Ne mise jamais plus de 5 % de ton capital pour ce type de pari.
Utilise-le seulement pour des occasions où ton capital principal est déjà sécurisé.
Cette stratégie doit être ponctuelle et réfléchie, jamais systématique.
Elle peut transformer une petite mise en jackpot mais peut aussi tout faire disparaître en un tour.`}
                            />
                             <StrategyItem
                                icon={<span className="font-bold text-lg">7</span>}
                                title="Gestion du capital"
                                description={`Ne jamais risquer plus de 1–2 % du capital par tour.
Si ton capital est de 50 000 FCFA, mise max 500–1 000 FCFA par tour.
Cela permet de tenir plusieurs tours même en cas de pertes consécutives.
Divise le capital en mini-pools pour gérer différentes stratégies en parallèle.
Cette discipline protège ton capital contre l’adrénaline et l’émotion.
Une bonne gestion du capital est le cœur de toute stratégie efficace.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">8</span>}
                                title="Martingale classique"
                                description={`Martingale = double la mise après chaque perte pour récupérer les pertes précédentes.
Exemple : tour 1 = 500 FCFA → perte, tour 2 = 1 000 FCFA → perte, tour 3 = 2 000 FCFA → gain.
Cette technique peut récupérer rapidement tes pertes si tu as un capital suffisant.
Mais attention : une longue série de pertes peut rapidement épuiser ton capital.
C’est une stratégie risquée et à utiliser seulement avec un capital important.
Elle fonctionne mieux sur des multiplicateurs bas et réguliers.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">9</span>}
                                title="Martingale modifiée"
                                description={`Pour limiter le risque, ne double pas trop vite tes mises.
Exemple : 500 → 1 000 → 1 500 FCFA au lieu de doubler systématiquement.
Cette méthode permet de récupérer les pertes plus lentement, mais plus sûr.
Elle te protège contre des crashes consécutifs élevés qui peuvent tout brûler.
Combine-la avec des retraits sécurisés pour limiter les pertes.
C’est une version plus prudente et adaptée aux petits capitales.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">10</span>}
                                title="Fibonacci"
                                description={`Augmente la mise selon la suite de Fibonacci après chaque perte : 500 → 500 → 1 000 → 1 500 → 2 500.
Après un gain, retourne à la mise initiale pour sécuriser ton capital.
C’est moins risqué que la martingale classique mais reste efficace pour récupérer des pertes.
Idéal pour les joueurs qui observent les tendances et veulent une progression contrôlée.
Tu peux adapter la suite selon ton capital et tes objectifs.
C’est une stratégie solide pour gérer les séries de pertes.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">11</span>}
                                title="Mise fractionnelle"
                                description={`Ne joue jamais ton capital entier sur un tour.
Mise seulement une fraction du gain potentiel que tu veux atteindre.
Exemple : capital 50 000 FCFA → mise = 10 % du gain visé.
Cela limite la perte en cas de crash et te permet de jouer plus longtemps.
C’est parfait pour diversifier tes paris sur plusieurs multiplicateurs.
Tu gardes ainsi le contrôle de ton capital tout en cherchant de gros gains.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">12</span>}
                                title="Analyse des patterns"
                                description={`Certains jeux affichent l’historique des multiplicateurs.
Note les tendances : après plusieurs tours bas, un multiplicateur élevé est plus probable.
Ne mise pas gros quand le multiplicateur reste constamment bas.
Cherche les cycles ou répétitions qui peuvent influencer ton timing.
Ce n’est jamais garanti, mais l’observation augmente tes chances de gains.
C’est un outil stratégique que beaucoup de joueurs ignorent.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">13</span>}
                                title="Fixer un objectif"
                                description={`Détermine un objectif clair par session, par exemple 10 000 FCFA de gains.
Une fois atteint, arrête de jouer pour sécuriser tes profits.
Cela évite de tout perdre par excès de confiance.
Tu peux aussi définir des mini-objectifs pour suivre ta progression.
Cette discipline transforme un jeu aléatoire en session rentable.
Objectifs = motivation + limite psychologique pour contrôler le jeu.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">14</span>}
                                title="Plafond de perte"
                                description={`Détermine combien tu es prêt à perdre par session, ex. 20 % du capital.
Une fois atteint, stop immédiat.
Évite les pertes cumulées qui peuvent décourager et ruiner ton capital.
Cela impose une discipline stricte et protège ton capital sur le long terme.
Combine avec un objectif de gain pour équilibrer risque et profit.
Ne jamais dépasser ton plafond = règle d’or.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">15</span>}
                                title="Ne pas courir après les pertes"
                                description={`Perdre plusieurs tours de suite peut déclencher l’adrénaline.
Ne mise pas plus pour tenter de récupérer tes pertes rapidement.
C’est la manière la plus rapide de tout perdre.
Fais une pause ou reprends avec des mises sécurisées.
Apprendre à accepter les pertes est clé pour un jeu rentable.
Le contrôle émotionnel est plus important que la stratégie technique.`}
                            />
                             <StrategyItem
                                icon={<span className="font-bold text-lg">16</span>}
                                title="Fractionner les mises"
                                description={`Divise ton capital en plusieurs petites mises sur différents multiplicateurs.
Exemple : 50 000 FCFA → 5 mises de 1 000 FCFA + 10 mises de 500 FCFA.
Cela te permet de sécuriser des gains constants tout en tentant des multiplicateurs élevés.
Chaque mini-mise agit comme un pari indépendant.
Réduit le risque global et augmente tes chances de gains cumulés.
C’est une technique que les pros utilisent pour gérer le capital efficacement.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">17</span>}
                                title="Timing du retrait"
                                description={`Le timing est essentiel : retirer trop tôt = petits gains, trop tard = perte.
Observe la montée du multiplicateur et fixe un seuil cible par tour.
Exemple : retirer à 1,8x pour sécuriser ou à 3x pour un peu plus de profit.
Adapte selon ton capital et ton objectif de gain.
Ne jamais baser le timing uniquement sur le feeling.
L’observation et l’expérience permettent de trouver le bon moment pour retirer.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">18</span>}
                                title="Combinaison des stratégies"
                                description={`Ne te limite pas à une seule stratégie.
Combine retraits sécurisés, martingale modifiée et mises fractionnelles pour équilibrer risque et gain.
Exemple : 70 % des mises sécurisées, 20 % en retrait moyen, 10 % en gros multiplicateur.
Cela permet de rester rentable même si certains tours crashent.
Tu diversifies tes paris comme un trader gère un portefeuille.
La combinaison est plus efficace qu’une seule stratégie isolée.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">19</span>}
                                title="Profiter des bonus"
                                description={`Beaucoup de casinos offrent bonus, free bets ou tours gratuits.
Exemple : 10 % bonus sur dépôt = capital supplémentaire à jouer sans risque réel.
Cela permet de tester des stratégies ou multiplier tes gains.
Lis toujours les conditions pour ne pas te retrouver piégé.
Les bonus peuvent transformer une session moyenne en session rentable.
C’est une ressource sous-utilisée par la plupart des joueurs.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">20</span>}
                                title="Suivi des gains"
                                description={`Note chaque tour : mise, multiplicateur, gain/perte.
Exemple : tableau Excel pour suivre les résultats en FCFA.
Tu verras les patterns et l’efficacité de tes stratégies.
Cela permet d’ajuster ton approche en temps réel.
Le suivi rend le jeu moins aléatoire et plus scientifique.
C’est la base pour évoluer vers un joueur discipliné et rentable.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">21</span>}
                                title="Discipline"
                                description={`Respecte strictement limites de mise, plafond de perte et objectifs de gain.
Ne change jamais de stratégie sous l’effet des émotions.
Les joueurs impulsifs perdent rapidement tout leur capital.
La discipline est plus importante que la chance.
Établir des règles avant de jouer te protège de l’excès de confiance.
Elle transforme un jeu de hasard en jeu géré et stratégique.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">22</span>}
                                title="Pauses régulières"
                                description={`Jouer fatigué = décisions mauvaises = pertes assurées.
Fais des pauses toutes les 15–30 minutes pour rester lucide.
Profite-en pour analyser les tours précédents et ajuster tes stratégies.
Respire, éloigne-toi de l’écran et reviens avec un esprit clair.
Les pros ne jouent jamais en continu sans repos.
Le mental est ton meilleur allié pour maximiser tes gains.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">23</span>}
                                title="Mental fort"
                                description={`Reste calme face aux pertes et aux gains rapides.
Ne laisse pas l’adrénaline influencer tes décisions.
Accepte que le hasard fera toujours partie du jeu.
La constance mentale permet de rester rentable sur le long terme.
Prends des notes, analyse, ajuste et continue avec discipline.
Le mental fort fait la différence entre un joueur chanceux et un joueur rentable.`}
                            />
                            <StrategyItem
                                icon={<span className="font-bold text-lg">24</span>}
                                title="Ajuster la stratégie"
                                description={`Ne reste pas bloqué sur une méthode qui ne fonctionne pas.
Observe, teste, corrige et adapte ton approche.
Exemple : réduire multiplicateur cible si les crashes arrivent trop tôt.
Changer la taille des mises selon la série de gains ou pertes.
La flexibilité est un atout majeur dans les jeux de hasard.
Un joueur qui s’adapte survivra plus longtemps et fera plus de profits.`}
                            />
                             <StrategyItem
                                icon={<span className="font-bold text-lg">25</span>}
                                title="Exemple concret en FCFA"
                                description={
                                    <div>
                                        <pre className="font-code text-xs bg-background/50 p-3 rounded-md overflow-x-auto">
                                            {`Tour | Mise(FCFA) | Cible | Gain Potentiel | Action\n--------------------------------------------------------------\n1    | 500       | 1,8x  | 900            | Retirer tôt\n2    | 500       | 2,5x  | 1 250          | Retirer moyen\n3    | 500       | 5x    | 2 500          | Retirer à 3x\n4    | 500       | 10x   | 5 000          | Risqué → 200FCFA\n5    | 1 000     | 1,5x  | 1 500          | Retirer tôt`}
                                        </pre>
                                        <div className="mt-2 space-y-2">
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
                                description={`Les jeux crash restent des jeux de hasard, mais une stratégie disciplinée, un capital bien géré et un mental fort permettent de maximiser les gains et limiter les pertes.
Points clés : commence petit, sécurise tes gains, fixe tes limites, note et analyse chaque session.
La patience et la discipline sont plus puissantes que la chance.
Combine plusieurs stratégies, observe les patterns, profite des bonus et prends des pauses régulières.
Avec cette approche, tu passes d’un joueur impulsif à un joueur réfléchi, rentable et durable.
Ton capital devient un outil pour générer des gains réguliers, tout en minimisant le risque de tout perdre.`}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    </>
  );
}
