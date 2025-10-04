
'use client';

import Lottie from "lottie-react";
import maintenanceAnimation from "../simulation/jetPredict.json"; // Réutilisation d'une animation Lottie existante
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }
  },
};

const GlitchText = ({ text }: { text: string }) => {
    return (
        <div className="relative font-bold text-5xl md:text-6xl text-center font-code uppercase">
            <span className="absolute inset-0 text-red-500 blur-sm animate-pulse" style={{ animationDelay: '0.1s' }}>{text}</span>
            <span className="absolute inset-0 text-cyan-400 blur-sm animate-pulse" style={{ animationDelay: '0.2s' }}>{text}</span>
            <span className="relative text-foreground">{text}</span>
        </div>
    );
};

export default function MaintenancePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden p-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 -z-10"></div>
        <motion.div 
            aria-hidden 
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0}}
            animate={{ opacity: 1, transition: { duration: 1 }}}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_30%,hsl(var(--primary)/0.15),transparent)]"></div>
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl"
                animate={{
                    x: [-20, 20, -20],
                    y: [-20, 20, -20],
                }}
                transition={{
                    duration: 20,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl"
                animate={{
                    x: [20, -20, 20],
                    y: [20, -20, 20],
                }}
                transition={{
                    duration: 25,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            />
        </motion.div>

        <motion.div 
            className="w-full max-w-lg text-center p-8 bg-card/50 backdrop-blur-lg border border-amber-500/20 rounded-2xl shadow-2xl shadow-amber-500/10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="w-full max-w-xs mx-auto">
                 <Lottie animationData={maintenanceAnimation} loop={true} />
            </div>

            <GlitchText text="Maintenance" />
            
            <p className="text-muted-foreground mt-6 mb-8 max-w-md mx-auto">
                Nos ingénieurs déploient une mise à jour majeure pour améliorer votre expérience. L'application sera de retour très prochainement, plus performante que jamais.
            </p>

            <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-code">UPGRADE IN PROGRESS...</p>
        </motion.div>
    </div>
  );
}
