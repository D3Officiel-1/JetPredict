
'use client';

import Lottie from "lottie-react";
import maintenanceAnimation from "../simulation/jetPredict.json";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const terminalLines = [
  "INITIALIZING SYSTEM UPGRADE...",
  "ACCESSING CORE MATRIX... [OK]",
  "DECOMPILING PREDICTION ENGINE... v3.1.4",
  "APPLYING QUANTUM HEURISTICS PATCH... [OK]",
  "CALIBRATING PROBABILITY VECTORS...",
  "FLUSHING TEMPORAL CACHE...",
  "ENHANCING AI CORE... PLEASE WAIT",
  "COMPILING NEW MODULES... 87% COMPLETE",
  "SYSTEM REBOOT IMMINENT...",
  "JET PREDICT WILL BE BACK ONLINE SHORTLY.",
];

export default function MaintenancePage() {
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    if (currentLine < terminalLines.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLine(prev => prev + 1);
      }, 400 + Math.random() * 300);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0A0F1E] text-green-400 font-code overflow-hidden p-4">
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
        className="relative w-full max-w-4xl p-6 border-2 border-primary/30 bg-black/50 backdrop-blur-sm rounded-lg shadow-[0_0_30px_rgba(0,191,255,0.2)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
      >
        <div className="absolute top-2 right-2 text-xs text-primary/50">STATUS: SYS_MAINTENANCE</div>
        <div className="absolute bottom-2 left-2 text-xs text-primary/50">KERNEL_v3.2.0_UPGR</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Lottie Animation */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-dashed border-primary/30 rounded-full p-2">
                <Lottie animationData={maintenanceAnimation} loop={true} />
            </div>
          </div>
          
          {/* Terminal Output */}
          <div className="md:col-span-2 h-64 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/80 to-transparent z-10 pointer-events-none"></div>
            <AnimatePresence>
              {terminalLines.slice(0, currentLine + 1).map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "whitespace-nowrap",
                    line.includes('[OK]') && "text-cyan-400",
                    line.includes('COMPLETE') && "text-yellow-400",
                    index === terminalLines.length - 1 && "text-white font-bold"
                  )}
                >
                  &gt; {line}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentLine + 1) / terminalLines.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
            </div>
            <p className="text-xs text-center text-primary/70 tracking-widest">
                SYSTEM UPGRADE IN PROGRESS... DO NOT POWER OFF
            </p>
        </div>
      </motion.div>
    </div>
  );
}
