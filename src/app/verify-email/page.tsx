

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User, sendEmailVerification, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, MailWarning, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  const handleResendEmail = useCallback(async () => {
    if (!user || isSending || countdown > 0) return;

    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        variant: 'success',
        title: 'Email envoyé',
        description: `Un nouvel email a été envoyé à ${user.email}.`,
      });
      const now = Date.now();
      setLastSentTime(now);
      localStorage.setItem('lastVerificationEmailSent', String(now));
      setCountdown(60);
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      let description = "Une erreur est survenue.";
      if (error.code === 'auth/too-many-requests') {
          description = "Trop de demandes. Réessayez plus tard.";
      }
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: description,
      });
    } finally {
      setIsSending(false);
    }
  }, [user, isSending, countdown, toast]);

  useEffect(() => {
    const lastSent = localStorage.getItem('lastVerificationEmailSent');
    if (lastSent) {
      const timeDiff = (Date.now() - Number(lastSent)) / 1000;
      if (timeDiff < 60) {
        setCountdown(Math.ceil(60 - timeDiff));
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          router.push('/predict');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);
  
  useEffect(() => {
      if (!user) return;
      
      const interval = setInterval(async () => {
          await user.reload();
          const freshUser = auth.currentUser;
          if (freshUser?.emailVerified) {
              router.push('/predict');
          }
      }, 3000);

      return () => clearInterval(interval);

  }, [user, auth, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }

  if (user.emailVerified) {
      return (
        <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
          <MailCheck className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold">Email vérifié !</h1>
          <p className="text-muted-foreground mb-4">Vous allez être redirigé...</p>
          <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={80} height={80} className="animate-pulse" priority />
        </div>
      );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c44,transparent)]"></div>

      <Card className="w-full max-w-md z-10 text-center">
        <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <MailWarning className="h-10 w-10 text-primary" />
            </div>
          <CardTitle>Vérifiez votre adresse e-mail</CardTitle>
          <CardDescription>
            Un lien de vérification a été envoyé à <strong className="text-primary">{user.email}</strong>. Vérifiez votre boîte de réception et vos spams.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas l'e-mail ?
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            className="w-full"
            onClick={handleResendEmail}
            disabled={isSending || countdown > 0}
          >
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : countdown > 0 ? (
              `Renvoyer dans ${countdown}s`
            ) : (
              "Renvoyer l'e-mail"
            )}
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    