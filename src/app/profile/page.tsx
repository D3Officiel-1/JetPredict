
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Wallet, ShieldCheck, CalendarIcon, Smartphone, Gamepad2, Gift, AtSign, Clock, Edit, Link2, Copy, Check, Bot } from 'lucide-react';
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

const InfoRow = ({ label, value, icon, index = 0 }: { label: string; value: string | React.ReactNode; icon: React.ReactNode, index?: number }) => (
    <motion.div
      className="relative flex flex-col gap-2 bg-muted/30 p-4 rounded-lg border border-border/20 overflow-hidden"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="absolute w-full h-full text-primary/20" viewBox="0 0 100 100">
                <polygon points="50,0 93,25 93,75 50,100 7,75 7,25" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            <div className="text-primary">{icon}</div>
        </div>
        <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      </div>
      <dd className="text-lg font-bold text-foreground text-left truncate">{value || 'N/A'}</dd>
    </motion.div>
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

const ScrambleText = ({ text, isVisible }: { text: string, isVisible: boolean }) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$*#?/%&';
    const [displayedText, setDisplayedText] = useState(text.split('').map(() => '•').join(''));

    useEffect(() => {
        if (isVisible) {
            let interval: NodeJS.Timeout;
            let iterations = 0;
            const targetText = text;

            interval = setInterval(() => {
                const newText = targetText.split('').map((char, index) => {
                    if (index < iterations) {
                        return targetText[index];
                    }
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join('');
                
                setDisplayedText(newText);
                
                if (iterations >= targetText.length) {
                    clearInterval(interval);
                }
                iterations += 1;
            }, 50);

            return () => clearInterval(interval);
        } else {
            setDisplayedText('•'.repeat(text.length));
        }
    }, [isVisible, text]);

    return (
        <motion.div
          className="flex font-mono tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {displayedText}
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
      <main className="w-full max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="relative w-full h-48 md:h-64 rounded-2xl bg-card/70 border border-border/50">
            <Image 
                src="https://picsum.photos/seed/profilebg/1200/400" 
                alt="Banner" 
                fill
                className="object-cover opacity-20 rounded-2xl"
                data-ai-hint="futuristic abstract"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent rounded-2xl"></div>
            
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:-translate-x-0 w-full md:w-auto px-4 md:px-0 z-10">
                <div className="relative w-36 h-36 mx-auto md:mx-0">
                    <Avatar className="w-full h-full border-4 border-background ring-4 ring-primary/50">
                        <AvatarImage src={user.photoURL || ''} alt={userData.username || 'Avatar'} />
                        <AvatarFallback className="text-5xl bg-muted">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-background ring-2 ${userData.isOnline ? 'bg-green-500 ring-green-500/30' : 'bg-destructive ring-destructive/30'}`}></div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10">
                <Button asChild variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm">
                    <Link href="/profile/edit">
                        <Edit className="h-5 w-5"/>
                    </Link>
                </Button>
            </div>
        </div>

        <div className="pt-20 md:pt-4 md:pl-52 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">{userData.username}</h1>
            <p className="text-muted-foreground mt-1">{userData.email}</p>
        </div>


        <div className="relative p-6 bg-card/70 backdrop-blur-sm border border-primary/20 rounded-2xl overflow-hidden shadow-lg shadow-primary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>
          
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
              <Bot className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground">Liaison de Compte Telegram</h3>
              <p className="text-sm text-muted-foreground mt-1">Copiez cette commande et envoyez-la à notre bot Telegram pour synchroniser votre compte.</p>
            </div>
          </div>
          
          <div className="mt-4 relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-cyan-500/50 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative flex items-stretch gap-0 bg-muted/50 border border-border rounded-lg overflow-hidden">
                <div className="flex-1 text-center font-mono tracking-wider text-foreground px-4 py-3 truncate flex items-center gap-2">
                    <span className="text-primary opacity-70">/link</span>
                    <span className="flex-1 text-left text-sm sm:text-base">
                        <AnimatePresence mode="wait">
                            <ScrambleText
                                key={isTokenVisible ? 'visible' : 'hidden'}
                                text={userData.telegramLinkToken || 'Génération...'}
                                isVisible={isTokenVisible}
                            />
                        </AnimatePresence>
                    </span>
                </div>
                <button 
                  onClick={handleCopyToken}
                  disabled={!userData.telegramLinkToken}
                  className="relative px-4 bg-primary/20 hover:bg-primary/30 text-primary-foreground transition-colors"
                >
                  <AnimatePresence mode="wait">
                    {isCopied ? (
                       <motion.div key="check" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}>
                          <Check className="h-5 w-5 text-green-400" />
                       </motion.div>
                    ) : (
                       <motion.div key="copy" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}>
                         <Copy className="h-5 w-5" />
                       </motion.div>
                    )}
                  </AnimatePresence>
                </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card/70 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><UserIcon/>Dossier Personnel</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.1 } }
                      }}
                    >
                        <InfoRow icon={<UserIcon size={16}/>} label="Nom Complet" value={`${userData.firstName} ${userData.lastName}`} index={0} />
                        <InfoRow icon={<Smartphone size={16}/>} label="Téléphone" value={userData.phone} index={1} />
                        <InfoRow icon={<Clock size={16}/>} label="Membre Depuis" value={formatDate(userData.createdAt)} index={2} />
                    </motion.div>
                </CardContent>
            </Card>
            
            <Card className="bg-card/70 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><ShieldCheck/>Abonnement</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                     <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1, delay: 0.3 } }
                        }}
                    >
                        <InfoRow icon={<ShieldCheck size={16}/>} label="Plan Actif" value={<span className="font-bold text-primary">{getPlanName()}</span>} index={0} />
                        <InfoRow icon={<CalendarIcon size={16}/>} label="Date de fin" value={formatDate(pricingData?.findate)} index={1} />
                        <InfoRow icon={<Wallet size={16}/>} label="Solde parrainage" value={<span className="font-bold text-green-400">{`${(userData.solde_referral || 0).toLocaleString('fr-FR')} FCFA`}</span>} index={2} />
                    </motion.div>
                </CardContent>
            </Card>
        </div>
        
        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3"><Gamepad2 />Préférences & Codes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.1, delay: 0.6 } }
                    }}
                >
                    <InfoRow icon={<Gamepad2 size={16}/>} label="Jeu favori" value={userData.favoriteGame} index={0} />
                    <InfoRow icon={<Gift size={16}/>} label="Code parrainage utilisé" value={userData.referralCode || "Aucun"} index={1} />
                    <InfoRow icon={<Gift size={16}/>} label="Code promo utilisé" value={userData.pronosticCode || "Aucun"} index={2} />
                 </motion.div>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}

