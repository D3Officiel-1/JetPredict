
'use client';

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && audioRef.current) {
      audioRef.current.volume = 0.15;
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked by the browser.
      });
    }
  }, [isClient]);

  const ParticleEffects = () => {
    const [initialPositions, setInitialPositions] = useState<any[]>([]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setInitialPositions(
          Array.from({ length: 30 }).map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            duration: 8 + Math.random() * 8,
            delay: Math.random() * 10,
            size: Math.random() * 2 + 1,
          }))
        );
      }
    }, []);

    if (initialPositions.length === 0) return null;

    return (
      <>
        {initialPositions.map((props, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/80 shadow-[0_0_10px_hsl(var(--primary))]"
            initial={{ 
              x: props.x, 
              y: props.y, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{
              y: props.y - (100 + Math.random() * 100),
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: props.duration,
              repeat: Infinity,
              delay: props.delay,
              ease: "easeInOut",
            }}
            style={{
              width: `${props.size}px`,
              height: `${props.size}px`,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-center text-foreground">
      {isClient && (
        <audio ref={audioRef} loop>
          <source src="/sounds/futuristic-hum.mp3" type="audio/mpeg" />
          <source src="/sounds/futuristic-hum.ogg" type="audio/ogg" />
        </audio>
      )}

      {/* Background elements */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0A0F1E] to-[#121832]"></div>
      <div className="absolute inset-0 z-10 bg-grid-pattern opacity-5"></div>
      
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        animate={{
          x: [-50, 50, -50],
          y: [-50, 50, -50],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          x: [50, -50, 50],
          y: [50, -50, 50],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 35,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      {isClient && <ParticleEffects />}

      {/* Content */}
      <div className="relative z-20 flex w-full max-w-4xl flex-col items-center">
        <motion.h1
          className="text-[10rem] font-black tracking-tighter text-transparent sm:text-[15rem] md:text-[20rem]"
          style={{
            WebkitTextStroke: "2px hsl(var(--primary))",
            textStroke: "2px hsl(var(--primary))",
            textShadow: "0 0 30px hsl(var(--primary) / 0.5)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }}
        >
          404
        </motion.h1>

        <motion.p
          className="mt-[-2rem] max-w-lg text-xl font-semibold tracking-wider text-foreground sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          VOUS AVEZ ATTEINT UN SECTEUR INCONNU
        </motion.p>
        <motion.p
          className="mt-2 max-w-md text-base text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          La page que vous cherchez a été perdue dans l'hyper-espace. Tentons un retour aux coordonnées de départ.
        </motion.p>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="/"
            className={cn(
              "group relative inline-block rounded-full px-8 py-4 font-bold text-lg text-primary-foreground",
              "bg-primary shadow-[0_0_25px_hsl(var(--primary)/0.6)]",
              "transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_hsl(var(--primary)/0.8)]"
            )}
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary via-cyan-300 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">RETOUR À L'ACCUEIL</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
