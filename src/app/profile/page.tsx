

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User as UserIcon, Wallet, ShieldCheck, CalendarIcon, Smartphone, Gamepad2, Gift, AtSign, Clock, Edit, Link2, Copy, Check, Bot } from 'lucide-react';
import Link from 'next/link';
import type { PlanId } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/ui/sidebar';

interface UserData {
  uid?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: Timestamp;
  username?: string;
  favoriteGame?: string;
  referralCode?: string;
  pronosticCode?: string;
  createdAt?: Timestamp;
  isOnline?: boolean;
  solde_referral?: number;
  telegramLinkToken?: string;
}

interface PricingData {
  idplan_jetpredict?: PlanId;
  actif_jetpredict?: boolean;
  startdate?: Timestamp;
  findate?: Timestamp;
}

const InfoRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0">
        <dt className="text-sm text-muted-foreground flex items-center gap-3">
            {icon}
            {label}
        </dt>
        <dd className="text-sm font-medium text-foreground text-right">{value || 'N/A'}</dd>
    </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
};

const characterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ScrambleText = ({ text }: { text: string }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex"
    >
      {text.split('').map((char, index) => (
        <motion.span key={index} variants={characterVariants}>
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);
  const { toast } = useToast();

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

      const userDocRef = doc(db, "users", currentUser.uid);
      const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");

      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
      });
      
      const unsubscribePricing = onSnapshot(pricingDocRef, async (pricingDoc) => {
        if (pricingDoc.exists()) {
          const data = pricingDoc.data() as PricingData;
          setPricingData(data);
          const isStillActive = data.actif_jetpredict === true;
          const expirationDate = data.findate?.toDate();

          if (isStillActive && expirationDate && expirationDate < new Date()) {
            await updateDoc(pricingDocRef, { actif_jetpredict: false });
            router.push('/pricing');
          } else if (!isStillActive) {
            router.push('/pricing');
          } else {
             setUser(currentUser);
          }
        } else {
            router.push('/pricing');
        }
        setIsLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribePricing();
      };

    });
    return () => unsubscribeAuth();
  }, [auth, router]);
  
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
  };

  const handleCopyToken = () => {
    if (!userData?.telegramLinkToken) return;
    const commandToCopy = `/link ${userData.telegramLinkToken}`;

    setIsTokenVisible(true);
    setIsCopied(true);

    navigator.clipboard.writeText(commandToCopy).then(() => {
      try {
        const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/12/12/audio_e6f0105ae1.mp3?filename=livechat-129007.mp3');
        audio.play();
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
      } catch (e) {
          console.error("Failed to play sound or vibrate:", e)
      }
    });

    setTimeout(() => {
        setIsCopied(false);
    }, 2000);
    setTimeout(() => {
        setIsTokenVisible(false);
    }, 5000);
  };

  if (isLoading || !user || !userData) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
        <p className="mt-4 text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }
  
  const getInitials = () => {
    if (userData?.username) {
        return userData.username.substring(0, 2).toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : '??';
  };

  const getPlanName = () => {
      switch (pricingData?.idplan_jetpredict) {
          case 'hourly': return 'Forfait Heure';
          case 'daily': return 'Forfait Jour';
          case 'weekly': return 'Forfait Semaine';
          case 'monthly': return 'Forfait Mois';
          default: return 'Abonnement';
      }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
        <Card className="bg-card/70 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-center gap-6 p-6">
             <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-primary/50">
                    <AvatarImage src={user.photoURL || ''} alt={userData.username || 'Avatar'} />
                    <AvatarFallback className="text-4xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-card ${userData.isOnline ? 'bg-green-500' : 'bg-destructive'}`}></div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-4xl font-bold">{userData.username}</CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                {userData.email}
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4"/>
                    Modifier le profil
                </Link>
             </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Bot/>Liaison Telegram</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Pour lier votre compte au bot Telegram, envoyez-lui la commande ci-dessous.</p>
                <div className="flex items-stretch gap-2">
                    <div className="flex-1 text-center text-sm sm:text-base font-mono tracking-wider bg-muted text-foreground rounded-lg px-4 py-3 border border-dashed border-border flex items-center justify-center truncate">
                        <span className="text-primary mr-2">/link</span>
                        <AnimatePresence mode="wait">
                          {isTokenVisible ? (
                            <ScrambleText text={userData.telegramLinkToken || 'Génération...'} />
                          ) : (
                            <motion.span
                                initial={{opacity: 0.5}}
                                animate={{opacity: [0.5, 1, 0.5]}}
                                transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                                exit={{opacity: 0}}
                            >
                              ••••••••••••••••••••••••
                            </motion.span>
                          )}
                        </AnimatePresence>
                    </div>
                    <Button onClick={handleCopyToken} variant="outline" className="px-4 h-auto" disabled={!userData.telegramLinkToken}>
                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card/70 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><UserIcon/>Informations</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <dl>
                        <InfoRow icon={<UserIcon size={16}/>} label="Nom" value={`${userData.firstName} ${userData.lastName}`} />
                        <InfoRow icon={<Smartphone size={16}/>} label="Téléphone" value={userData.phone} />
                        <InfoRow icon={<Clock size={16}/>} label="Membre depuis" value={formatDate(userData.createdAt)} />
                    </dl>
                </CardContent>
            </Card>
            
            <Card className="bg-card/70 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><ShieldCheck/>Abonnement</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <dl>
                        <InfoRow icon={<ShieldCheck size={16}/>} label="Plan Actif" value={<span className="font-bold text-primary">{getPlanName()}</span>} />
                        <InfoRow icon={<CalendarIcon size={16}/>} label="Date de fin" value={formatDate(pricingData?.findate)} />
                        <InfoRow icon={<Wallet size={16}/>} label="Solde parrainage" value={<span className="font-bold text-green-400">{`${(userData.solde_referral || 0).toLocaleString('fr-FR')} FCFA`}</span>} />
                    </dl>
                </CardContent>
            </Card>
        </div>
        
        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Gamepad2 />Préférences & Codes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                 <dl>
                    <InfoRow icon={<Gamepad2 size={16}/>} label="Jeu favori" value={userData.favoriteGame} />
                    <InfoRow icon={<Gift size={16}/>} label="Code parrainage utilisé" value={userData.referralCode || "Aucun"} />
                    <InfoRow icon={<Gift size={16}/>} label="Code promo utilisé" value={userData.pronosticCode || "Aucun"} />
                 </dl>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}

    
