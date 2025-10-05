

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PricingSection } from '@/components/pricing-section';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

const loadingTexts = [
    "ANALYSE DU PROFIL...",
    "VÉRIFICATION DES ACCÈS...",
    "SYNCHRONISATION AU NOYAU...",
    "PROTOCOLES CHARGÉS.",
];

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    if (isCheckingAuth) {
        const textInterval = setInterval(() => {
            setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
        }, 500);
        return () => clearInterval(textInterval);
    }
  }, [isCheckingAuth])

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
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#313b5c44,transparent)]"></div>
      
      <main className="relative z-10 container mx-auto max-w-7xl py-20">
        <PricingSection user={user} />
      </main>
    </div>
  );
}
