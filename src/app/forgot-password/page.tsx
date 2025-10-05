
'use client';

import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 }
  },
};

const iconVariants = {
    hidden: { scale: 0.5, opacity: 0, rotate: -30 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        rotate: 0,
        transition: { type: 'spring', damping: 15, stiffness: 150, delay: 0.2 }
    }
}

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const { toast } = useToast();
  const auth = getAuth(app);

  const showSuccess = (email: string) => {
    setIsSent(true);
    setSentToEmail(email);
    setIsLoading(false);
  };
  
  const showGenericSuccess = () => {
    setIsSent(true);
    setSentToEmail('');
    setIsLoading(false);
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let userDocId: string | null = null;
    let userEmail: string | null = null;

    try {
      const usersRef = collection(db, "users");
      let q;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(identifier)) {
        userEmail = identifier;
        q = query(usersRef, where("email", "==", identifier));
      } else {
        q = query(usersRef, where("username", "==", identifier));
      }

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          userDocId = userDoc.id;
          const userData = userDoc.data();
          userEmail = userData.email;

          if (!userEmail) {
            showGenericSuccess();
            return;
          }

          const userRef = doc(db, "users", userDocId);
          const freshUserDoc = await getDoc(userRef);
          const freshUserData = freshUserDoc.data();

          let count = freshUserData?.passwordResetRequestCount || 0;
          const lastRequestDate = freshUserData?.lastPasswordResetRequestAt?.toDate();
          const today = new Date();
          
          if (lastRequestDate && lastRequestDate.toDateString() !== today.toDateString()) {
              count = 0;
          }

          if (count >= 5) {
              toast({
                  variant: 'destructive',
                  title: 'Limite de 5 demandes par jour atteinte.',
              });
              setIsLoading(false);
              return;
          }

          await sendPasswordResetEmail(auth, userEmail);
          
          await updateDoc(userRef, {
              passwordResetRequestCount: count + 1,
              lastPasswordResetRequestAt: serverTimestamp(),
          });
      }
      
      if (userEmail) {
          showSuccess(userEmail);
      } else {
          showGenericSuccess();
      }

    } catch (error: any) {
      console.error("Error during password reset:", error);
      showGenericSuccess();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 -z-10"></div>
        <motion.div 
            aria-hidden 
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0}}
            animate={{ opacity: 1, transition: { duration: 1 }}}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_30%,hsl(var(--primary)/0.15),transparent)]"></div>
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"
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
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"
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

      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Link>
        </Button>
      </div>

        {isSent ? (
            <motion.div 
                className="w-full max-w-md text-center p-8 bg-card/50 backdrop-blur-lg border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={iconVariants} className="flex justify-center mb-6">
                    <MailCheck className="w-24 h-24 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/>
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Email Envoyé !</h1>
                <p className="text-muted-foreground mb-8">
                    {sentToEmail ? `Un email a été envoyé à ${sentToEmail}. Vérifiez vos spams.` : "Si un compte est associé à votre identifiant, vous recevrez un lien de réinitialisation."}
                </p>
                <Button asChild className="w-full">
                    <Link href="/login">Retour à la connexion</Link>
                </Button>
            </motion.div>
        ) : (
            <motion.div 
                className="w-full max-w-md"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
             >
                <form onSubmit={handleResetPassword}>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Mot de passe oublié</h1>
                    <p className="text-muted-foreground mt-2">
                        Entrez votre e-mail ou pseudo pour recevoir un lien de réinitialisation.
                    </p>
                </div>

                <div className="grid gap-4 p-8 bg-card/50 backdrop-blur-lg border border-border/20 rounded-2xl shadow-2xl shadow-primary/10">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">Email ou Pseudo</Label>
                        <Input
                            id="identifier"
                            type="text"
                            placeholder="votre@email.com ou VotrePseudo"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="mt-2">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Envoyer le lien
                        </Button>
                    </div>
                </div>
                
                </form>
            </motion.div>
        )}
    </div>
  );
}
