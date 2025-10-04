
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const logoVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 100,
      delay: 0.2,
    },
  },
};

const textVariants = {
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

const loadingBarVariants = {
  hidden: { width: "0%" },
  visible: {
    width: "100%",
    transition: {
      duration: 3,
      ease: "linear",
      delay: 0.5,
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
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExiting && (
          <motion.div
            key="splash-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="z-10 flex flex-col items-center"
          >
            <motion.div variants={logoVariants} className="relative flex items-center justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-primary/30"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 3],
                    opacity: [1, 0],
                  }}
                  transition={{
                    delay: i * 0.5 + 0.5,
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  style={{
                    width: '128px',
                    height: '128px',
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
              className="mt-6 text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground"
              variants={textVariants}
            >
              Jet Predict
            </motion.h1>

            <motion.div
              className="mt-12 w-48 h-1 bg-muted/30 rounded-full overflow-hidden"
              variants={textVariants}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
                variants={loadingBarVariants}
              />
            </motion.div>

            <motion.p className="mt-4 text-sm text-muted-foreground" variants={textVariants}>
              Initialisation des systèmes...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExiting && (
          <motion.footer
            className="absolute bottom-5 text-xs text-muted-foreground/50 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8 } }}
            exit={{ opacity: 0 }}
          >
            © {new Date().getFullYear()} Jet Predict — #D3 Officiel
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
