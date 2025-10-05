

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PricingSection } from '@/components/pricing-section';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Listen for pricing changes in real-time
        const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
        const unsubscribePricing = onSnapshot(pricingDocRef, async (doc) => {
          if (doc.exists()) {
            const pricingData = doc.data();
            const isStillActive = pricingData.actif_jetpredict === true;
            const expirationDate = pricingData.findate?.toDate();

            // Vérifier si l'abonnement a expiré
            if (isStillActive && expirationDate && expirationDate < new Date()) {
                await updateDoc(pricingDocRef, { actif_jetpredict: false });
                setIsCheckingAuth(false); // L'abonnement a expiré, on reste sur la page de prix
            } else if (isStillActive) {
                 router.push('/predict'); // L'abonnement est actif
            } else {
                 setIsCheckingAuth(false); // Pas d'abonnement actif, on reste sur la page de prix
            }
          } else {
            setIsCheckingAuth(false); // Document de prix non trouvé
          }
        }, () => {
            // In case of error, still allow viewing the page
            setIsCheckingAuth(false);
        });

        return () => unsubscribePricing();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [auth, router]);

  if (isCheckingAuth || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" />
        <p className="mt-4 text-muted-foreground">Vérification de votre abonnement...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#313b5c44,transparent)]"></div>
      
      <main className="relative z-10 container mx-auto max-w-7xl py-20">
        <PricingSection user={user} />
      </main>
    </div>
  );
}
