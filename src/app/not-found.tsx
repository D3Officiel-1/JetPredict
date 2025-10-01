
'use client';

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Premium404() {
  const particles = Array.from({ length: 25 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && audioRef.current) {
      audioRef.current.volume = 0.2;
      audioRef.current.play().catch(() => {
        // Some browsers block autoplay, fallback handled silently
      });
    }
  }, [isClient]);

  const ParticleEffects = () => {
      const [initialPositions, setInitialPositions] = useState<any[]>([]);

      useEffect(() => {
        if (typeof window !== 'undefined') {
            setInitialPositions(
                Array.from({ length: 25 }).map(() => ({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    left: Math.random() * 100 + "%",
                    duration: 6 + Math.random() * 4,
                    delay: Math.random() * 5,
                }))
            );
        }
      }, []);

      if (initialPositions.length === 0) return null;

      return (
        <>
            {initialPositions.map((props, i) => (
                <motion.span
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"
                initial={{
                    x: props.x,
                    y: props.y,
                    opacity: 0,
                    scale: 0,
                }}
                animate={{
                    y: [null, -50],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                }}
                transition={{
                    duration: props.duration,
                    repeat: Infinity,
                    delay: props.delay,
                }}
                style={{ left: props.left }}
                />
            ))}
        </>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-6 relative overflow-hidden">
      {/* Ambient futuristic sound */}
      {isClient && (
          <audio ref={audioRef} loop>
            <source src="/sounds/futuristic-hum.mp3" type="audio/mpeg" />
            <source src="/sounds/futuristic-hum.ogg" type="audio/ogg" />
          </audio>
      )}

      {/* Animated futuristic orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-10 left-10 w-96 h-96 bg-primary rounded-full filter blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-10 right-10 w-[32rem] h-[32rem] bg-secondary rounded-full filter blur-[150px]"
      />

      {/* Neon grid background */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Floating particles */}
      {isClient && <ParticleEffects />}

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-[12rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-[0_0_25px_hsl(var(--primary)/0.8)] tracking-widest"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-6 text-2xl text-foreground tracking-wide drop-shadow-md"
        >
          🚀 Destination inconnue : cette page a disparu dans le futur.
        </motion.p>

        {/* Futuristic button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <Link
            href="/"
            className="relative inline-flex items-center px-10 py-4 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-semibold text-xl shadow-[0_0_20px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_35px_hsl(var(--secondary)/0.8)] hover:scale-105 transition-transform duration-300 overflow-hidden"
          >
            <span className="relative z-10">Retour à l'accueil</span>
            <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-20 transition" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}