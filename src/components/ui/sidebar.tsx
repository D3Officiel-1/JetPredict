

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
import { LogOut, Settings, User as UserIcon, Beaker, Bell, LifeBuoy, Users, ShieldAlert, HelpCircle, Compass, X, Wallet, Rocket } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Switch } from '@/components/ui/switch';

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
    const props = href && !disabled ? { href, target: "_blank", rel: "noopener noreferrer" } : { onClick: disabled ? undefined : onClick };
    
    return (
        <motion.div variants={menuItemVariants}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Wrapper
                            {...props}
                            className={cn(
                                "h-14 w-14 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                                disabled ? "cursor-not-allowed opacity-60" : ""
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
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userData?.username || user.displayName || 'Mon Compte'}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
      
       {!isFabDisabled && (
          <div className="fixed bottom-6 right-6 z-40">
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
                  >
                    <FABMenuItem icon={<Image src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Blue_Question_Circle.svg" alt="Guide" width={56} height={56} />} label="Guide" onClick={() => setIsGuideOpen(true)} />
                    <FABMenuItem icon={<Image src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width={56} height={56} />} label="WhatsApp" href="https://whatsapp.com/channel/0029VbB81H82kNFwTwis9a07" />
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
          </div>
      )}

       <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Guide d'utilisation</DialogTitle>
                </DialogHeader>
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
            </DialogContent>
        </Dialog>
    </>
  );
}
