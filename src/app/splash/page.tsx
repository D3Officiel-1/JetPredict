'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.5,
    },
  },
  exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
          duration: 0.5,
          ease: 'easeIn'
      }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      duration: 0.8,
    },
  },
};

export default function SplashPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => router.push('/'), 500); // Wait for exit animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_50%,#313b5c33,transparent)]"></div>

        <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-primary/30 blur-2xl"
            animate={{
                y: [0, "100vh"],
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
            }}
        />

        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="flex flex-col items-center justify-center z-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.div variants={logoVariants} className="relative flex items-center justify-center">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full border border-primary/50"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{
                                        scale: [1, 2.5],
                                        opacity: [1, 0]
                                    }}
                                    transition={{
                                        delay: i * 0.4 + 0.5,
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        ease: "easeOut"
                                    }}
                                    style={{
                                        width: '128px',
                                        height: '128px',
                                    }}
                                />
                            ))}
                        
                            <Image
                                src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png"
                                alt="JetPredict Logo"
                                width={128}
                                height={128}
                                className="rounded-md shadow-2xl shadow-primary/20"
                                priority
                            />
                        </motion.div>

                        <motion.h1 
                            className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-300"
                            variants={itemVariants}
                        >
                            JetPredict
                        </motion.h1>

                        <motion.p className="text-lg text-muted-foreground" variants={itemVariants}>
                          prédiction de côte
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {!isExiting && (
                <motion.footer 
                    className="absolute bottom-5 text-xs text-muted-foreground/50 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeIn' }}
                >
                    © {new Date().getFullYear()} 2025 JetPredict — #D3 Officiel
                </motion.footer>
            )}
        </AnimatePresence>
    </div>
  );
}

    