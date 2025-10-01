
'use client';

import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc, query, collection, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from '@/lib/firebase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

const countries = [
    { name: 'Bénin', code: '+229', flag: 'https://flagcdn.com/bj.svg' },
    { name: 'Botswana', code: '+267', flag: 'https://flagcdn.com/bw.svg' },
    { name: 'Burkina Faso', code: '+226', flag: 'https://flagcdn.com/bf.svg' },
    { name: 'Cameroun', code: '+237', flag: 'https://flagcdn.com/cm.svg' },
    { name: 'Centrafrique (RCA)', code: '+236', flag: 'https://flagcdn.com/cf.svg' },
    { name: 'Tchad', code: '+235', flag: 'https://flagcdn.com/td.svg' },
    { name: 'Côte d’Ivoire', code: '+225', flag: 'https://flagcdn.com/ci.svg' },
    { name: 'Égypte', code: '+20', flag: 'https://flagcdn.com/eg.svg' },
    { name: 'France', code: '+33', flag: 'https://flagcdn.com/fr.svg' },
    { name: 'Gabon', code: '+241', flag: 'https://flagcdn.com/ga.svg' },
    { name: 'Gambie', code: '+220', flag: 'https://flagcdn.com/gm.svg' },
    { name: 'Ghana', code: '+233', flag: 'https://flagcdn.com/gh.svg' },
    { name: 'Guinée (Conakry)', code: '+224', flag: 'https://flagcdn.com/gn.svg' },
    { name: 'Guinée-Bissau', code: '+245', flag: 'https://flagcdn.com/gw.svg' },
    { name: 'Liberia (Libéria)', code: '+231', flag: 'https://flagcdn.com/lr.svg' },
    { name: 'Luxembourg', code: '+352', flag: 'https://flagcdn.com/lu.svg' },
    { name: 'Madagascar', code: '+261', flag: 'https://flagcdn.com/mg.svg' },
    { name: 'Mali', code: '+223', flag: 'https://flagcdn.com/ml.svg' },
    { name: 'Mauritanie', code: '+222', flag: 'https://flagcdn.com/mr.svg' },
    { name: 'Maroc', code: '+212', flag: 'https://flagcdn.com/ma.svg' },
    { name: 'Moldavie', code: '+373', flag: 'https://flagcdn.com/md.svg' },
    { name: 'Niger', code: '+227', flag: 'https://flagcdn.com/ne.svg' },
    { name: 'Nigeria', code: '+234', flag: 'https://flagcdn.com/ng.svg' },
    { name: 'Pologne', code: '+48', flag: 'https://flagcdn.com/pl.svg' },
    { name: 'Roumanie', code: '+40', flag: 'https://flagcdn.com/ro.svg' },
    { name: 'Rwanda', code: '+250', flag: 'https://flagcdn.com/rw.svg' },
    { name: 'Sénégal', code: '+221', flag: 'https://flagcdn.com/sn.svg' },
    { name: 'Sierra Leone', code: '+232', flag: 'https://flagcdn.com/sl.svg' },
    { name: 'Slovaquie', code: '+421', flag: 'https://flagcdn.com/sk.svg' },
    { name: 'South Africa (Afrique du Sud)', code: '+27', flag: 'https://flagcdn.com/za.svg' },
    { name: 'South Sudan (Soudan du Sud)', code: '+211', flag: 'https://flagcdn.com/ss.svg' },
    { name: 'Soudan', code: '+249', flag: 'https://flagcdn.com/sd.svg' },
    { name: 'Togo', code: '+228', flag: 'https://flagcdn.com/tg.svg' },
    { name: 'Tunisie', code: '+216', flag: 'https://flagcdn.com/tn.svg' },
    { name: 'Ouganda (Uganda)', code: '+256', flag: 'https://flagcdn.com/ug.svg' },
    { name: 'Zambie', code: '+260', flag: 'https://flagcdn.com/zm.svg' },
    { name: 'Iran', code: '+98', flag: 'https://flagcdn.com/ir.svg' },
];

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


export default function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('email-user');
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/predict');
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleSuccessfulLogin = async (user: any, isNewUser: boolean = false) => {
      const userDocRef = doc(db, "users", user.uid);
      
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
          });

          const pricingDocRef = doc(db, "users", user.uid, "pricing", "jetpredict");
          await setDoc(pricingDocRef, {
              actif_jetpredict: false,
              idplan_jetpredict: null,
              startdate: null,
              findate: null,
          });
          
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
          await updateDoc(userDocRef, { isOnline: true, photoURL: user.photoURL });
          toast({
            variant: 'success',
            title: 'Connexion réussie',
          });
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

      if (activeTab === 'email-user') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(loginIdentifier)) {
          userEmail = loginIdentifier;
        } else { // It's a username
          q = query(usersRef, where("username", "==", loginIdentifier));
        }
      } else { // activeTab is 'phone'
        const fullPhoneNumber = `${countryCode}${phone}`;
        q = query(usersRef, where("phone", "==", fullPhoneNumber));
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

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }

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
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

       <motion.div
         className="w-full max-w-sm"
         variants={containerVariants}
         initial="hidden"
         animate="visible"
       >
        <form onSubmit={handleLogin}>
          <div className="text-center mb-8">
             <Link href="/" className="flex justify-center mb-4 items-center gap-2">
                <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="JetPredict Logo" width={36} height={36} className="h-9 w-auto rounded-md" style={{ width: 'auto' }} priority />
                <span className="text-2xl font-bold text-primary">JetPredict</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Connexion</h1>
            <p className="text-muted-foreground mt-2">
              Entrez vos identifiants pour accéder à votre compte.
            </p>
          </div>
          <div className="grid gap-4 p-8 bg-card/50 backdrop-blur-lg border border-border/20 rounded-2xl shadow-2xl shadow-primary/10">
            <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-5 w-5"/>}
                Continuer avec Google
            </Button>

             <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/50 px-2 text-muted-foreground">Ou continuer avec</span>
                </div>
            </div>


            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email-user">Email / Pseudo</TabsTrigger>
                <TabsTrigger value="phone">Téléphone</TabsTrigger>
              </TabsList>
              <TabsContent value="email-user" className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="loginIdentifier">Email ou Pseudo</Label>
                  <Input 
                    id="loginIdentifier" 
                    type="text" 
                    placeholder="Votre email ou pseudo" 
                    required 
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </TabsContent>
              <TabsContent value="phone" className="space-y-4 pt-4">
                 <div className="grid gap-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[120px] bg-background/50">
                                <SelectValue placeholder="Pays" />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <div className="flex items-center gap-2">
                                            <Image src={country.flag} alt={country.name} width={20} height={15} />
                                            <span>{country.code}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Numéro" required className="flex-1 bg-background/50" />
                    </div>
                </div>
              </TabsContent>
            </Tabs>
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
              <div className="relative flex items-center">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
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
  );
}