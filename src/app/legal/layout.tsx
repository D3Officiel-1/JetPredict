
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
       <header className="fixed top-0 left-0 right-0 z-50 p-4">
          <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              className="container mx-auto flex items-center justify-between p-2 rounded-2xl bg-card/50 dark:bg-black/20 backdrop-blur-md border border-border/50 dark:border-white/10"
          >
              <Link href="/" className="flex items-center gap-2.5">
                  <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={32} height={32} className="h-8 w-auto rounded-md" />
                  <span className="text-lg font-bold text-primary">Jet Predict</span>
              </Link>
              <Link href="/login" passHref>
                  <Button variant="ghost" className="rounded-full">
                      Commencer
                      <ChevronRight size={16} className="ml-1" />
                  </Button>
              </Link>
          </motion.div>
      </header>

      <main className="relative z-10 container mx-auto max-w-4xl px-4 py-24 sm:py-32">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-10">
            {children}
        </div>
      </main>
    </div>
  );
}
