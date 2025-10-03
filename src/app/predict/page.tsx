

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { CrashPredictorDashboard } from '@/components/crash-predictor-dashboard';
import Header from '@/components/ui/sidebar'; 
import type { PlanId } from '@/types';


interface NotificationSettings {
    alertsEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
}

export default function PredictPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ notificationSettings?: NotificationSettings } | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();
  
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
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
        <p className="mt-4 text-muted-foreground">Vérification de l'abonnement...</p>
      </div>
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

