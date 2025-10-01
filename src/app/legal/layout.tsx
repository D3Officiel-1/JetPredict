import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#313b5c44,transparent)]"></div>
      
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>

      <main className="relative z-10 container mx-auto max-w-4xl py-20">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-10">
            {children}
        </div>
      </main>
    </div>
  );
}
