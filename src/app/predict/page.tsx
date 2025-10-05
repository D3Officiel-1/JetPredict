

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

import { CrashPredictorDashboard } from '@/components/crash-predictor-dashboard';
import Header from '@/components/ui/sidebar'; 
import type { PlanId } from '@/types';


interface NotificationSettings {
    alertsEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
}

const loadingTexts = [
    "ANALYSE DU PROFIL...",
    "VÉRIFICATION DES ACCÈS...",
    "SYNCHRONISATION AU NOYAU...",
    "PROTOCOLES CHARGÉS.",
];

export default function PredictPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ notificationSettings?: NotificationSettings } | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const auth = getAuth(app);
  const router = useRouter();
  
  useEffect(() => {
     if (isLoading) {
        const textInterval = setInterval(() => {
            setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
        }, 500);
        return () => clearInterval(textInterval);
    }
  }, [isLoading])
  
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
                    
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const unsubscribeUserData = onSnapshot(userDocRef, (doc) => {
                        if (doc.exists()) {
                            setUserData(doc.data());
                        }
                        setIsLoading(false);
                    });
                    return () => unsubscribeUserData();

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

      return () => {
          if (unsubscribeMaintenance) unsubscribeMaintenance();
          if (unsubscribePricing) unsubscribePricing();
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


  if (isLoading || !user || !planId) {
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <CrashPredictorDashboard planId={planId} notificationSettings={userData?.notificationSettings} />
      </main>
    </div>
  );
}
