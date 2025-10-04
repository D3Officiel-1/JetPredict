
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

const fabVariants = {
  closed: { scale: 1, rotate: 0 },
  open: { scale: 1, rotate: 45 },
};

const menuContainerVariants = {
  closed: {
    opacity: 0,
    scale: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      delayChildren: 0.1,
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};


const menuItemVariants = {
  closed: { opacity: 0, y: 20, scale: 0.8 },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
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
        <motion.div variants={menuItemVariants}>
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

  const StrategyItem = ({ title, content }: { title: string, content: React.ReactNode }) => (
    <div className="p-4 bg-muted/30 border border-border/30 rounded-lg space-y-2">
        <h4 className="text-md font-semibold text-primary">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-1">{content}</div>
    </div>
  );

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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Guide & FAQ</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="guide" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="guide">Guide d'Utilisation</TabsTrigger>
                        <TabsTrigger value="how-to">Comment Jouer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="guide">
                         <div className="py-4 space-y-6">
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
                    <TabsContent value="how-to">
                        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                            <StrategyItem title="1. Comprendre le principe">
                                <p>Les jeux crash comme Aviator ou Lucky Jet fonctionnent sur un multiplicateur qui monte progressivement à partir de 1x.</p>
                                <p>Chaque tour commence avec une mise et le multiplicateur augmente jusqu’à ce qu’il "crash" de manière aléatoire.</p>
                                <p>Ton objectif est de retirer avant que le multiplicateur s’effondre, sinon tu perds toute ta mise.</p>
                                <p>C’est un jeu de hasard pur, mais avec observation et timing, tu peux gérer ton risque.</p>
                                <p>Le multiplicateur peut être très bas ou atteindre des valeurs très élevées (&gt;10x).</p>
                                <p>Comprendre ce mécanisme est la première étape avant de commencer à miser sérieusement.</p>
                            </StrategyItem>
                            <StrategyItem title="2. Commencer petit">
                                <p>Avant de miser gros, teste toujours le jeu avec de petites mises.</p>
                                <p>Exemple : 200–500 FCFA par tour pour un capital initial de 50 000 FCFA.</p>
                                <p>Cela te permet de comprendre la vitesse de montée du multiplicateur et le timing optimal du retrait.</p>
                                <p>Les petits tours servent aussi à observer les tendances et le comportement du jeu.</p>
                                <p>Tu peux noter combien de tours finissent en crash bas et combien atteignent un multiplicateur élevé.</p>
                                <p>Commencer petit limite ton risque et t’apprend à jouer intelligemment.</p>
                            </StrategyItem>
                            <StrategyItem title="3. Fixer un capital">
                                <p>Détermine exactement combien tu es prêt à jouer pour une session.</p>
                                <p>Exemple : capital = 50 000 FCFA pour 1 journée de jeu.</p>
                                <p>Ne dépasse jamais ce capital pour éviter de tout perdre sur une mauvaise série.</p>
                                <p>Divise ce capital en petites portions pour chaque tour afin de mieux contrôler les mises.</p>
                                <p>Cela t’évite de te retrouver à miser tout ton argent en une seule fois par frustration ou excès de confiance.</p>
                                <p>Un capital clair permet de suivre tes gains et pertes plus efficacement.</p>
                            </StrategyItem>
                            <StrategyItem title="4. Mise sécurisée">
                                <p>Pour sécuriser tes gains, retire toujours à des multiplicateurs bas mais fiables.</p>
                                <p>Exemple : mise 500 FCFA → retirer à 1,8x → gain 900 FCFA.</p>
                                <p>Cela permet d’accumuler des profits constants même si les gros multiplicateurs restent rares.</p>
                                <p>Cette stratégie est parfaite pour débuter et protéger ton capital.</p>
                                <p>Elle réduit le stress, car tu n’as pas à courir après des jackpots risqués.</p>
                                <p>Elle te permet aussi de tester différentes tendances sans mettre ton capital en danger.</p>
                            </StrategyItem>
                            <StrategyItem title="5. Retrait moyen">
                                <p>Vise un multiplicateur intermédiaire pour un équilibre risque/gain.</p>
                                <p>Exemple : mise 500 FCFA → retirer à 3x → gain 1 500 FCFA.</p>
                                <p>C’est une stratégie pour ceux qui veulent un peu plus de profit sans prendre de gros risques.</p>
                                <p>Elle fonctionne mieux si tu observes des tendances dans les multiplicateurs.</p>
                                <p>Tu peux combiner ce retrait moyen avec des petites mises sécurisées pour diversifier tes gains.</p>
                                <p>C’est une étape intermédiaire avant d’attaquer les multiplicateurs élevés et risqués.</p>
                            </StrategyItem>
                            <StrategyItem title="6. Retrait risqué">
                                <p>Viser les multiplicateurs élevés (&gt;5x) peut rapporter gros mais est très dangereux.</p>
                                <p>Exemple : mise 500 FCFA → retirer à 10x → gain potentiel 5 000 FCFA.</p>
                                <p>Ne mise jamais plus de 5 % de ton capital pour ce type de pari.</p>
                                <p>Utilise-le seulement pour des occasions où ton capital principal est déjà sécurisé.</p>
                                <p>Cette stratégie doit être ponctuelle et réfléchie, jamais systématique.</p>
                                <p>Elle peut transformer une petite mise en jackpot mais peut aussi tout faire disparaître en un tour.</p>
                            </StrategyItem>
                            <StrategyItem title="7. Gestion du capital">
                                <p>Ne jamais risquer plus de 1–2 % du capital par tour.</p>
                                <p>Si ton capital est de 50 000 FCFA, mise max 500–1 000 FCFA par tour.</p>
                                <p>Cela permet de tenir plusieurs tours même en cas de pertes consécutives.</p>
                                <p>Divise le capital en mini-pools pour gérer différentes stratégies en parallèle.</p>
                                <p>Cette discipline protège ton capital contre l’adrénaline et l’émotion.</p>
                                <p>Une bonne gestion du capital est le cœur de toute stratégie efficace.</p>
                            </StrategyItem>
                            <StrategyItem title="8. Martingale classique">
                                <p>Martingale = double la mise après chaque perte pour récupérer les pertes précédentes.</p>
                                <p>Exemple : tour 1 = 500 FCFA → perte, tour 2 = 1 000 FCFA → perte, tour 3 = 2 000 FCFA → gain.</p>
                                <p>Cette technique peut récupérer rapidement tes pertes si tu as un capital suffisant.</p>
                                <p>Mais attention : une longue série de pertes peut rapidement épuiser ton capital.</p>
                                <p>C’est une stratégie risquée et à utiliser seulement avec un capital important.</p>
                                <p>Elle fonctionne mieux sur des multiplicateurs bas et réguliers.</p>
                            </StrategyItem>
                            <StrategyItem title="9. Martingale modifiée">
                                <p>Pour limiter le risque, ne double pas trop vite tes mises.</p>
                                <p>Exemple : 500 → 1 000 → 1 500 FCFA au lieu de doubler systématiquement.</p>
                                <p>Cette méthode permet de récupérer les pertes plus lentement, mais plus sûr.</p>
                                <p>Elle te protège contre des crashes consécutifs élevés qui peuvent tout brûler.</p>
                                <p>Combine-la avec des retraits sécurisés pour limiter les pertes.</p>
                                <p>C’est une version plus prudente et adaptée aux petits capitales.</p>
                            </StrategyItem>
                            <StrategyItem title="10. Fibonacci">
                                <p>Augmente la mise selon la suite de Fibonacci après chaque perte : 500 → 500 → 1 000 → 1 500 → 2 500.</p>
                                <p>Après un gain, retourne à la mise initiale pour sécuriser ton capital.</p>
                                <p>C’est moins risqué que la martingale classique mais reste efficace pour récupérer des pertes.</p>
                                <p>Idéal pour les joueurs qui observent les tendances et veulent une progression contrôlée.</p>
                                <p>Tu peux adapter la suite selon ton capital et tes objectifs.</p>
                                <p>C’est une stratégie solide pour gérer les séries de pertes.</p>
                            </StrategyItem>
                            <StrategyItem title="11. Mise fractionnelle">
                                <p>Ne joue jamais ton capital entier sur un tour.</p>
                                <p>Mise seulement une fraction du gain potentiel que tu veux atteindre.</p>
                                <p>Exemple : capital 50 000 FCFA → mise = 10 % du gain visé.</p>
                                <p>Cela limite la perte en cas de crash et te permet de jouer plus longtemps.</p>
                                <p>C’est parfait pour diversifier tes paris sur plusieurs multiplicateurs.</p>
                                <p>Tu gardes ainsi le contrôle de ton capital tout en cherchant de gros gains.</p>
                            </StrategyItem>
                            <StrategyItem title="12. Analyse des patterns">
                                <p>Certains jeux affichent l’historique des multiplicateurs.</p>
                                <p>Note les tendances : après plusieurs tours bas, un multiplicateur élevé est plus probable.</p>
                                <p>Ne mise pas gros quand le multiplicateur reste constamment bas.</p>
                                <p>Cherche les cycles ou répétitions qui peuvent influencer ton timing.</p>
                                <p>Ce n’est jamais garanti, mais l’observation augmente tes chances de gains.</p>
                                <p>C’est un outil stratégique que beaucoup de joueurs ignorent.</p>
                            </StrategyItem>
                            <StrategyItem title="13. Fixer un objectif">
                                <p>Détermine un objectif clair par session, par exemple 10 000 FCFA de gains.</p>
                                <p>Une fois atteint, arrête de jouer pour sécuriser tes profits.</p>
                                <p>Cela évite de tout perdre par excès de confiance.</p>
                                <p>Tu peux aussi définir des mini-objectifs pour suivre ta progression.</p>
                                <p>Cette discipline transforme un jeu aléatoire en session rentable.</p>
                                <p>Objectifs = motivation + limite psychologique pour contrôler le jeu.</p>
                            </StrategyItem>
                            <StrategyItem title="14. Plafond de perte">
                                <p>Détermine combien tu es prêt à perdre par session, ex. 20 % du capital.</p>
                                <p>Une fois atteint, stop immédiat.</p>
                                <p>Évite les pertes cumulées qui peuvent décourager et ruiner ton capital.</p>
                                <p>Cela impose une discipline stricte et protège ton capital sur le long terme.</p>
                                <p>Combine avec un objectif de gain pour équilibrer risque et profit.</p>
                                <p>Ne jamais dépasser ton plafond = règle d’or.</p>
                            </StrategyItem>
                            <StrategyItem title="15. Ne pas courir après les pertes">
                                <p>Perdre plusieurs tours de suite peut déclencher l’adrénaline.</p>
                                <p>Ne mise pas plus pour tenter de récupérer tes pertes rapidement.</p>
                                <p>C’est la manière la plus rapide de tout perdre.</p>
                                <p>Fais une pause ou reprends avec des mises sécurisées.</p>
                                <p>Apprendre à accepter les pertes est clé pour un jeu rentable.</p>
                                <p>Le contrôle émotionnel est plus important que la stratégie technique.</p>
                            </StrategyItem>
                            <StrategyItem title="16. Fractionner les mises">
                                <p>Divise ton capital en plusieurs petites mises sur différents multiplicateurs.</p>
                                <p>Exemple : 50 000 FCFA → 5 mises de 1 000 FCFA + 10 mises de 500 FCFA.</p>
                                <p>Cela te permet de sécuriser des gains constants tout en tentant des multiplicateurs élevés.</p>
                                <p>Chaque mini-mise agit comme un pari indépendant.</p>
                                <p>Réduit le risque global et augmente tes chances de gains cumulés.</p>
                                <p>C’est une technique que les pros utilisent pour gérer le capital efficacement.</p>
                            </StrategyItem>
                            <StrategyItem title="17. Timing du retrait">
                                <p>Le timing est essentiel : retirer trop tôt = petits gains, trop tard = perte.</p>
                                <p>Observe la montée du multiplicateur et fixe un seuil cible par tour.</p>
                                <p>Exemple : retirer à 1,8x pour sécuriser ou à 3x pour un peu plus de profit.</p>
                                <p>Adapte selon ton capital et ton objectif de gain.</p>
                                <p>Ne jamais baser le timing uniquement sur le feeling.</p>
                                <p>L’observation et l’expérience permettent de trouver le bon moment pour retirer.</p>
                            </StrategyItem>
                            <StrategyItem title="18. Combinaison des stratégies">
                                <p>Ne te limite pas à une seule stratégie.</p>
                                <p>Combine retraits sécurisés, martingale modifiée et mises fractionnelles pour équilibrer risque et gain.</p>
                                <p>Exemple : 70 % des mises sécurisées, 20 % en retrait moyen, 10 % en gros multiplicateur.</p>
                                <p>Cela permet de rester rentable même si certains tours crashent.</p>
                                <p>Tu diversifies tes paris comme un trader gère un portefeuille.</p>
                                <p>La combinaison est plus efficace qu’une seule stratégie isolée.</p>
                            </StrategyItem>
                            <StrategyItem title="19. Profiter des bonus">
                                <p>Beaucoup de casinos offrent bonus, free bets ou tours gratuits.</p>
                                <p>Exemple : 10 % bonus sur dépôt = capital supplémentaire à jouer sans risque réel.</p>
                                <p>Cela permet de tester des stratégies ou multiplier tes gains.</p>
                                <p>Lis toujours les conditions pour ne pas te retrouver piégé.</p>
                                <p>Les bonus peuvent transformer une session moyenne en session rentable.</p>
                                <p>C’est une ressource sous-utilisée par la plupart des joueurs.</p>
                            </StrategyItem>
                            <StrategyItem title="20. Suivi des gains">
                                <p>Note chaque tour : mise, multiplicateur, gain/perte.</p>
                                <p>Exemple : tableau Excel pour suivre les résultats en FCFA.</p>
                                <p>Tu verras les patterns et l’efficacité de tes stratégies.</p>
                                <p>Cela permet d’ajuster ton approche en temps réel.</p>
                                <p>Le suivi rend le jeu moins aléatoire et plus scientifique.</p>
                                <p>C’est la base pour évoluer vers un joueur discipliné et rentable.</p>
                            </StrategyItem>
                            <StrategyItem title="21. Discipline">
                                <p>Respecte strictement limites de mise, plafond de perte et objectifs de gain.</p>
                                <p>Ne change jamais de stratégie sous l’effet des émotions.</p>
                                <p>Les joueurs impulsifs perdent rapidement tout leur capital.</p>
                                <p>La discipline est plus importante que la chance.</p>
                                <p>Établir des règles avant de jouer te protège de l’excès de confiance.</p>
                                <p>Elle transforme un jeu de hasard en jeu géré et stratégique.</p>
                            </StrategyItem>
                            <StrategyItem title="22. Pauses régulières">
                                <p>Jouer fatigué = décisions mauvaises = pertes assurées.</p>
                                <p>Fais des pauses toutes les 15–30 minutes pour rester lucide.</p>
                                <p>Profite-en pour analyser les tours précédents et ajuster tes stratégies.</p>
                                <p>Respire, éloigne-toi de l’écran et reviens avec un esprit clair.</p>
                                <p>Les pros ne jouent jamais en continu sans repos.</p>
                                <p>Le mental est ton meilleur allié pour maximiser tes gains.</p>
                            </StrategyItem>
                            <StrategyItem title="23. Mental fort">
                                <p>Reste calme face aux pertes et aux gains rapides.</p>
                                <p>Ne laisse pas l’adrénaline influencer tes décisions.</p>
                                <p>Accepte que le hasard fera toujours partie du jeu.</p>
                                <p>La constance mentale permet de rester rentable sur le long terme.</p>
                                <p>Prends des notes, analyse, ajuste et continue avec discipline.</p>
                                <p>Le mental fort fait la différence entre un joueur chanceux et un joueur rentable.</p>
                            </StrategyItem>
                            <StrategyItem title="24. Ajuster la stratégie">
                                <p>Ne reste pas bloqué sur une méthode qui ne fonctionne pas.</p>
                                <p>Observe, teste, corrige et adapte ton approche.</p>
                                <p>Exemple : réduire multiplicateur cible si les crashes arrivent trop tôt.</p>
                                <p>Changer la taille des mises selon la série de gains ou pertes.</p>
                                <p>La flexibilité est un atout majeur dans les jeux de hasard.</p>
                                <p>Un joueur qui s’adapte survivra plus longtemps et fera plus de profits.</p>
                            </StrategyItem>
                            <StrategyItem title="25. Exemple concret en FCFA">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="p-2">Tour</th>
                                                <th className="p-2">Mise (FCFA)</th>
                                                <th className="p-2">Multiplicateur cible</th>
                                                <th className="p-2">Gain potentiel (FCFA)</th>
                                                <th className="p-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-border/20">
                                                <td className="p-2">1</td><td className="p-2">500</td><td className="p-2">1,8x</td><td className="p-2">900</td><td className="p-2">Retirer tôt</td>
                                            </tr>
                                            <tr className="border-b border-border/20">
                                                <td className="p-2">2</td><td className="p-2">500</td><td className="p-2">2,5x</td><td className="p-2">1 250</td><td className="p-2">Retirer moyen</td>
                                            </tr>
                                            <tr className="border-b border-border/20">
                                                <td className="p-2">3</td><td className="p-2">500</td><td className="p-2">5x</td><td className="p-2">2 500</td><td className="p-2">Retirer à 3x → 1 500</td>
                                            </tr>
                                            <tr className="border-b border-border/20">
                                                <td className="p-2">4</td><td className="p-2">500</td><td className="p-2">10x</td><td className="p-2">5 000</td><td className="p-2">Risqué → ne miser que 200 FCFA</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2">5</td><td className="p-2">1 000</td><td className="p-2">1,5x</td><td className="p-2">1 500</td><td className="p-2">Retirer tôt</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-2">Chaque tour doit être planifié selon ton capital, ton objectif et ton niveau de risque.</p>
                                <p>Note les résultats, ajuste et reste discipliné pour maximiser les gains.</p>
                                <p>Avec cette méthode, tu transformes un jeu aléatoire en jeu stratégique et rentable.</p>
                            </StrategyItem>
                            <StrategyItem title="Conclusion">
                                <p>Les jeux crash restent des jeux de hasard, mais une stratégie disciplinée, un capital bien géré et un mental fort permettent de maximiser les gains et limiter les pertes.</p>
                                <p>Points clés : commence petit, sécurise tes gains, fixe tes limites, note et analyse chaque session.</p>
                                <p>La patience et la discipline sont plus puissantes que la chance.</p>
                                <p>Combine plusieurs stratégies, observe les patterns, profite des bonus et prends des pauses régulières.</p>
                                <p>Avec cette approche, tu passes d’un joueur impulsif à un joueur réfléchi, rentable et durable.</p>
                                <p>Ton capital devient un outil pour générer des gains réguliers, tout en minimisant le risque de tout perdre.</p>
                            </StrategyItem>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    </>
  );
}
