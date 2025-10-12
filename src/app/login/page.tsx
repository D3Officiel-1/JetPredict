
'use client';

import { useState, useEffect, Suspense } from 'react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc, query, collection, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from '@/lib/firebase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 }
  },
};

const GoogleIcon = (props: any) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.599-1.521,12.647-4.044l-5.617-5.571C29.046,38.506,26.675,40,24,40c-5.216,0-9.559-3.46-11.083-8.192l-6.522,5.025C9.505,41.136,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.617,5.571C41.652,35.247,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const loadingTexts = [
    "DÉMARRAGE DU NOYAU...",
    "ACCÈS AU DATACLUSTER...",
    "CHARGEMENT DES MODÈLES IA...",
    "VÉRIFICATION DES PROTOCOLES...",
    "SYNCHRONISATION TERMINÉE.",
];

function LoginContent() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId) {
      localStorage.setItem('telegramChatId', chatId);
    }
  }, [searchParams]);

  const handleSuccessfulLogin = async (user: any, isNewUser: boolean = false) => {
      const userDocRef = doc(db, "users", user.uid);
      const chatId = localStorage.getItem('telegramChatId');
      
      const updateData: { isOnline: boolean; photoURL?: string | null; telegramChatId?: string } = {
        isOnline: true,
        photoURL: user.photoURL,
      };

      if (chatId) {
          updateData.telegramChatId = chatId;
      }
      
      if (isNewUser) {
          const [firstName, ...lastName] = (user.displayName || '').split(' ');
          await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              username: user.email?.split('@')[0] + Math.floor(Math.random()*100),
              firstName: firstName || '',
              lastName: lastName.join(' ') || '',
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              isOnline: true,
              solde_referral: 0,
              telegramChatId: chatId || null,
          });

          const pricingDocRef = doc(db, "users", user.uid, "pricing", "jetpredict");
          await setDoc(pricingDocRef, {
              actif_jetpredict: false,
              idplan_jetpredict: null,
              startdate: null,
              findate: null,
          });
          if (chatId) localStorage.removeItem('telegramChatId');
          router.push('/register/google');

      } else { // Existing user
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.isOnline === true) {
              toast({
                  variant: 'destructive',
                  title: 'Connexion impossible',
                  description: "Ce compte est déjà actif sur un autre appareil."
              });
              await auth.signOut();
              setIsLoading(false);
              return;
          }
          await updateDoc(userDocRef, updateData);
          toast({
            variant: 'success',
            title: 'Connexion réussie',
          });
          if (chatId) localStorage.removeItem('telegramChatId');
          router.push('/predict');
      }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        await handleSuccessfulLogin(user, !userDocSnap.exists());

    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            setIsLoading(false);
            return;
        }
        console.error(error);
        toast({
            variant: 'destructive',
            title: "Erreur de connexion Google",
            description: "Une erreur est survenue, veuillez réessayer.",
        });
        setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let userEmail = '';

    try {
      const usersRef = collection(db, "users");
      let q;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(loginIdentifier)) {
        userEmail = loginIdentifier;
      } else { // It's a username
        q = query(usersRef, where("username", "==", loginIdentifier));
      }
      
      if (!userEmail && q) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userEmail = querySnapshot.docs[0].data().email;
        } else {
          toast({ variant: 'destructive', title: "Identifiants incorrects." });
          setIsLoading(false);
          return;
        }
      }

      if (!userEmail) {
        toast({ variant: 'destructive', title: "Identifiant invalide." });
        setIsLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      await handleSuccessfulLogin(userCredential.user);

    } catch (error: any) {
      console.error(error);
      let title = "Une erreur est survenue.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        title = "Les identifiants sont incorrects.";
      }
      toast({
        variant: 'destructive',
        title: title,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
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
      
       <div className="w-full flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
           <div className="w-full h-full lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
                <div className="hidden lg:flex flex-col items-center justify-center text-center">
                   <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                   >
                     <Link href="/" className="flex flex-col items-center gap-4 mb-8">
                        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={80} height={80} className="h-20 w-auto rounded-xl" priority />
                        <span className="text-4xl font-bold text-primary tracking-tight">Jet Predict</span>
                    </Link>
                    <p className="text-2xl font-semibold text-foreground">Accédez à l'avant-garde de la prédiction.</p>
                    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">Connectez-vous pour déployer nos modèles d'analyse et prendre l'avantage.</p>
                   </motion.div>
                </div>

                <div className="flex items-center justify-center w-full">
                     <motion.div
                        className="w-full max-w-sm"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <form onSubmit={handleLogin}>
                            <div className="text-center mb-8">
                                <Link href="/" className="flex justify-center mb-4 items-center gap-2 lg:hidden">
                                    <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Jet Predict Logo" width={36} height={36} className="h-9 w-auto rounded-md" style={{ width: 'auto' }} priority />
                                    <span className="text-2xl font-bold text-primary">Jet Predict</span>
                                </Link>
                                <h1 className="text-3xl font-bold text-foreground">Connexion</h1>
                                <p className="text-muted-foreground mt-2">
                                Entrez vos identifiants pour accéder à votre compte.
                                </p>
                            </div>
                            <div className="grid gap-6">
                                <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="h-12 text-base">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-5 w-5"/>}
                                    Continuer avec Google
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-border/50" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                <Label htmlFor="loginIdentifier">Email ou Pseudo</Label>
                                <Input 
                                    id="loginIdentifier" 
                                    type="text" 
                                    placeholder="Votre email ou pseudo" 
                                    required 
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    className="h-12 bg-background/50"
                                />
                                </div>
                            
                                <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-primary hover:underline"
                                    >
                                    Mot de passe oublié ?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-background/50 pr-10"
                                    />
                                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(p => !p)}>
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                                </div>
                                <div className="flex flex-col gap-4 mt-2">
                                    <Button className="w-full h-12 text-base" type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Se connecter
                                    </Button>
                                    <div className="text-center text-sm">
                                    Vous n'avez pas de compte ?{' '}
                                    <Link href="/register" className="underline text-primary">
                                        S'inscrire
                                    </Link>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
           </div>
       </div>
    </div>
  )
}

export default function LoginPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/predict');
      } else {
        setTimeout(() => setIsCheckingAuth(false), 3000);
      }
    });

    const textInterval = setInterval(() => {
        setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => {
        unsubscribe();
        clearInterval(textInterval);
    };
  }, [auth, router]);

  if (isCheckingAuth) {
    return (
      <motion.div 
          className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_farthest-side,hsl(var(--background)),transparent)]"></div>

        <motion.div 
          className="relative w-32 h-32 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }}
        >
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div 
            className="absolute inset-2 rounded-full border-2 border-primary/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="w-full h-full object-contain" priority />
        </motion.div>

        <div className="relative w-64 h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="h-6 mt-4">
            <AnimatePresence mode="wait">
                <motion.p
                    key={loadingTextIndex}
                    className="font-code text-sm text-primary tracking-widest"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {loadingTexts[loadingTextIndex]}
                </motion.p>
            </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
