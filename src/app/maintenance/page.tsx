
'use client';

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface MaintenanceConfig {
    message?: string;
    mediaUrl?: string;
    buttonTitle?: string;
    buttonUrl?: string;
}

export default function MaintenancePage() {
    const [config, setConfig] = useState<MaintenanceConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const docRef = doc(db, "applications", "VMrS6ltRDuKImzxAl3lR");
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Si la maintenance est désactivée, redirigez
                if (data.status === false) {
                    router.push('/predict');
                    return;
                }
                setConfig(data.maintenanceConfig || {});
            } else {
                // Si le document n'existe pas, on suppose que la maintenance n'est pas active
                router.push('/predict');
                return;
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching maintenance config:", error);
            setConfig({}); // Assume no maintenance on error, but stay on page
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const message = config?.message || "Notre service est actuellement en maintenance pour des améliorations. Nous serons de retour très bientôt.";
    const mediaUrl = config?.mediaUrl || "https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png";
    const buttonTitle = config?.buttonTitle;
    const buttonUrl = config?.buttonUrl;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E] text-white font-body overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(0,191,255,0.1),transparent)]"></div>
      
      {/* Scanline Effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-primary/20"
        animate={{ y: [0, '100vh'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      
      <motion.div
        className="relative w-full max-w-lg p-6 sm:p-8 border-2 border-primary/30 bg-black/50 backdrop-blur-sm rounded-lg shadow-[0_0_40px_rgba(0,191,255,0.25)] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
      >
        <div className="absolute top-2 right-2 text-xs text-primary/50 font-code">STATUS: OFFLINE</div>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-primary/70">Chargement du statut...</p>
            </div>
        ) : (
             <div className="flex flex-col items-center gap-6">
                <motion.div 
                    className="relative h-32 w-32"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' }}}
                >
                    <Image
                        src={mediaUrl} 
                        alt="Maintenance"
                        width={128}
                        height={128}
                        className="object-contain"
                        priority
                    />
                </motion.div>
                
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-300">MAINTENANCE EN COURS</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
                </div>
                
                {buttonTitle && buttonUrl && (
                    <Button 
                        asChild
                        size="lg"
                        className="font-semibold text-lg py-6 px-8 rounded-full group shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:shadow-primary/50"
                    >
                        <a href={buttonUrl} target="_blank" rel="noopener noreferrer">
                            {buttonTitle}
                            <ExternalLink className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                        </a>
                    </Button>
                )}
            </div>
        )}

      </motion.div>
    </div>
  );
}
