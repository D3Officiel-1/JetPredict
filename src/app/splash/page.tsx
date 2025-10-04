
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const systemChecks = [
  "Démarrage de JetOS...",
  "Initialisation de la matrice de prédiction...",
  "Connexion au noyau IA...",
  "Calibrage du moteur de probabilités...",
  "Chargement des heuristiques quantiques...",
  "Système en ligne.",
];

export default function SplashPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [currentCheck, setCurrentCheck] = useState(0);

  useEffect(() => {
    // Navigate away after the full sequence
    const navigationTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => router.push('/'), 500); // Wait for exit animation
    }, 4000);

    // Cycle through system check messages
    const textInterval = setInterval(() => {
      setCurrentCheck((prev) => {
        if (prev < systemChecks.length - 1) {
          return prev + 1;
        }
        clearInterval(textInterval);
        return prev;
      });
    }, 500);

    return () => {
      clearTimeout(navigationTimer);
      clearInterval(textInterval);
    };
  }, [router]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1 } }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]"></div>
             {[...Array(4)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-px h-full bg-gradient-to-b from-primary/0 to-primary/30 to-primary/0"
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: ["-100%", "100%"], opacity: [0, 1, 0] }}
                    transition={{
                        delay: i * 0.5,
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear",
                    }}
                    style={{ left: `${(i + 1) * 20}%` }}
                />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExiting && (
          <motion.div
            key="splash-content"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
            className="z-10 flex flex-col items-center w-full max-w-sm"
          >
            <motion.div
              className="relative w-32 h-32 mb-8"
              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, transition: { type: 'spring', damping: 15, stiffness: 100, delay: 0.3 } }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/50"
                  animate={{ rotate: 360 }}
                  transition={{
                    delay: i * 0.2,
                    duration: 10 + i * 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
              <Image
                src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png"
                alt="Jet Predict Logo"
                width={128}
                height={128}
                className="rounded-full shadow-2xl shadow-primary/20"
                priority
              />
            </motion.div>

            <motion.h1
              className="text-5xl font-extrabold tracking-tighter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.8 } }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                Jet Predict
              </span>
            </motion.h1>

             <motion.div
              className="mt-8 w-full h-8 flex items-center justify-center font-code text-sm text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1 } }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentCheck}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {systemChecks[currentCheck]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExiting && (
          <motion.footer
            className="absolute bottom-5 text-xs text-muted-foreground/50 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.5 } }}
            exit={{ opacity: 0 }}
          >
            © {new Date().getFullYear()} Jet Predict — #D3 Officiel
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
