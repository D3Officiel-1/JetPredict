
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { app, db, requestForToken, onMessageListener } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon, Beaker, Bell, LifeBuoy, Users, ShieldAlert, HelpCircle, Plus, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanId } from '@/types';
import { useToast } from '@/hooks/use-toast';

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

const menuVariants = {
  closed: {
    opacity: 0,
    scale: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, y: 15 },
  open: { opacity: 1, y: 0 },
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
  const content = (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-3 cursor-pointer group"
      onClick={disabled ? undefined : onClick}
    >
      <span className="text-right text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-md border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
        {icon}
      </div>
    </motion.div>
  );

  const button = disabled && tooltip ? (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="opacity-50 cursor-not-allowed">{content}</div>
            </TooltipTrigger>
            <TooltipContent><p>{tooltip}</p></TooltipContent>
        </Tooltip>
     </TooltipProvider>
  ) : (
    content
  );

  return href && !disabled ? <Link href={href}>{button}</Link> : button;
};


export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ username?: string, solde_referral?: number } | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const auth = getAuth(app);
  const router = useRouter();
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

    return () => unsubscribeAuth();
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarImage src={user.photoURL ?? ''} alt="Avatar" />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && <span className="premium-notification-pulse"></span>}
                      {!isVerified && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-destructive ring-2 ring-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {unreadCount > 0 && <TooltipContent><p>Vous avez {unreadCount} notification(s) non lue(s)</p></TooltipContent>}
                {!isVerified && <TooltipContent><p>Veuillez vérifier votre email</p></TooltipContent>}
              </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent className="w-56" align="start" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userData?.username || user.displayName || 'Mon Compte'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
              <DropdownMenuItem asChild disabled={!isVerified}><Link href="/notification"><Bell className="mr-2 h-4 w-4" /><span>Notifications</span>{unreadCount > 0 && <span className="notification-dot"></span>}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isVerified}><Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /><span>Profil</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isVerified}><Link href="/referral"><Users className="mr-2 h-4 w-4" /><span>Parrainage</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isVerified || !canAccessPremiumFeatures}><Link href="/simulation"><Beaker className="mr-2 h-4 w-4" /><span>Simulation</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isVerified}><Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>Paramètres</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild disabled={!isVerified || !canAccessSupport}><Link href="/support"><LifeBuoy className="mr-2 h-4 w-4" /><span>Support</span></Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Se déconnecter</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
              <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="JetPredict Logo" width={32} height={32} className="h-8 w-auto rounded-md" />
              <h1 className="font-headline text-xl font-bold text-primary hidden sm:block">JetPredict</h1>
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <div className="text-right">
                      <p className="font-bold text-lg text-green-400">{(userData?.solde_referral || 0).toLocaleString('fr-FR')} FCFA</p>
                  </div>
              </TooltipTrigger>
              <TooltipContent><p>Solde Parrainage</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      <div className="fixed bottom-6 right-6 z-40">
        <motion.div
            className="relative"
            initial="closed"
            animate={isFabMenuOpen ? "open" : "closed"}
            onHoverStart={() => setIsFabMenuOpen(true)}
            onHoverEnd={() => setIsFabMenuOpen(false)}
        >
            <AnimatePresence>
                {isFabMenuOpen && (
                    <motion.div
                        variants={menuVariants}
                        className="absolute bottom-full right-0 mb-4 flex flex-col items-end gap-4"
                    >
                        <FABMenuItem
                            icon={<HelpCircle size={24} />}
                            label="Guide"
                            onClick={() => setIsGuideOpen(true)}
                        />
                         <FABMenuItem
                            icon={<Users size={24} />}
                            label="Parrainage"
                            href="/referral"
                        />
                         <FABMenuItem
                            icon={<LifeBuoy size={24} />}
                            label="Support Premium"
                            href="/support"
                            disabled={!canAccessSupport}
                            tooltip="Réservé au forfait Mois"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                variants={fabVariants}
                className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            >
                <Plus size={28} />
            </motion.button>
        </motion.div>
      </div>

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
