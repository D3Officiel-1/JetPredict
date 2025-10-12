
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp, writeBatch, getDoc, updateDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, PartyPopper, Eye, EyeOff, XCircle, CheckCircle, ShieldCheck, Gamepad2, Mail, User, Cake, VenetianMask } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AviatorLogo, LuckyJetLogo } from '@/components/icons';

const TOTAL_STEPS_BASE = 9;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  })
};

const GoogleIcon = (props: any) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.599-1.521,12.647-4.044l-5.617-5.571C29.046,38.506,26.675,40,24,40c-5.216,0-9.559-3.46-11.083-8.192l-6.522,5.025C9.505,41.136,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.617,5.571C41.652,35.247,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const RadioCard = ({ id, value, children, selectedValue, onSelect, className }: { id: string, value: string, children: React.ReactNode, selectedValue: string, onSelect: (value: string) => void, className?: string }) => {
    const isSelected = selectedValue === value;
    return (
        <motion.div 
            className="relative" 
            onClick={() => onSelect(value)}
            whileHover={{ y: -5, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <AnimatePresence>
                {isSelected && (
                    <motion.div 
                        layoutId="radio-card-border" 
                        className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary via-cyan-400 to-primary blur-sm opacity-75"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>
            <div className={cn(
                "relative h-full flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all duration-300",
                isSelected ? 'bg-card border-primary shadow-lg shadow-primary/20' : 'bg-card/50 border-border hover:border-primary/50',
                className
            )}>
                {children}
            </div>
        </motion.div>
    );
};


export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [direction, setDirection] = useState(0);
  const [step, setStep] = useState(0);

  const [refCodeFromUrl, setRefCodeFromUrl] = useState('');
  const [finalTotalSteps, setFinalTotalSteps] = useState(TOTAL_STEPS_BASE);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefCodeFromUrl(ref);
      setFinalTotalSteps(TOTAL_STEPS_BASE - 1);
      setFormData(prev => ({
        ...prev,
        hasReferralCode: 'oui',
        referralCode: ref,
      }));
      setReferralCodeStatus('valid');
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
    dob_day: '',
    dob_month: '',
    dob_year: '',
    username: '',
    isPronostiqueur: '',
    pronostiqueurCode: '',
    favoriteGame: '',
    otherFavoriteGame: '',
    hasReferralCode: '',
    referralCode: '',
    cguAccepted: false,
  });

    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        uppercase: false,
        lowercase: false,
        number: false,
    });
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'taken'>('idle');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const [referralCodeStatus, setReferralCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = getAuth(app);
  
  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        const allPasswordReqsMet = Object.values(passwordValidation).every(Boolean);
        const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailRegex.test(formData.email);
        const allowedDomains = [
          'gmail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 
          'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 
          'me.com', 'mac.com', 'proton.me', 'protonmail.com', 
          'zoho.com', 'gmx.com', 'mail.com'
        ];
        const emailDomain = formData.email.split('@')[1];
        const isDomainAllowed = emailDomain && allowedDomains.includes(emailDomain.toLowerCase());
        return allPasswordReqsMet && passwordsMatch && isEmailValid && isDomainAllowed;
      case 2:
        return formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
      case 3:
        return formData.gender !== '';
      case 4:
        const day = parseInt(formData.dob_day, 10);
        const month = parseInt(formData.dob_month, 10);
        const year = parseInt(formData.dob_year, 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        if (day < 1 || day > 31 || month < 1 || month > 12) return false;

        const today = new Date();
        const birthDate = new Date(year, month - 1, day);
        if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
            return false;
        }
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 18 && age <= 100;
      case 5:
        return usernameStatus === 'valid';
      case 6:
        if (formData.isPronostiqueur === 'non') return true;
        if (formData.isPronostiqueur === 'oui') {
            return formData.pronostiqueurCode.trim() !== '';
        }
        return false;
      case 7:
        if (formData.favoriteGame === 'autre') {
          return formData.otherFavoriteGame.trim() !== '';
        }
        return formData.favoriteGame !== '';
      case 8:
        if (refCodeFromUrl) return true;
        if (formData.hasReferralCode === 'non') return true;
        if (formData.hasReferralCode === 'oui') return referralCodeStatus === 'valid';
        return false;
      case 9:
        return formData.cguAccepted;
      default:
        return false;
    }
  }, [step, formData, passwordValidation, usernameStatus, referralCodeStatus, refCodeFromUrl]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        if (id === 'password') {
          setPasswordValidation({
              minLength: value.length >= 8,
              uppercase: /[A-Z]/.test(value),
              lowercase: /[a-z]/.test(value),
              number: /\d/.test(value),
          });
        }
    };
    
    const checkUsername = useCallback(async (username: string) => {
        if (!username || username.trim().length < 3) {
            setUsernameStatus('idle');
            return;
        }
        
        const invalidCharsRegex = /[\s\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        if (invalidCharsRegex.test(username)) {
            setUsernameStatus('invalid');
            return;
        }

        setIsCheckingUsername(true);
        setUsernameStatus('checking');
        try {
            const q = query(collection(db, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setUsernameStatus('valid');
            } else {
                setUsernameStatus('taken');
            }
        } catch (error) {
            console.error('Error checking username:', error);
            setUsernameStatus('idle');
        } finally {
            setIsCheckingUsername(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (step === 5) {
                checkUsername(formData.username);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [formData.username, step, checkUsername]);
    
    const checkReferralCode = useCallback(async (code: string) => {
        if (!code || code.trim().length === 0) {
            setReferralCodeStatus('idle');
            return;
        }
        
        setIsCheckingPromo(true);
        setReferralCodeStatus('checking');
        
        try {
            const q = query(collection(db, "users"), where("username", "==", code));
            const querySnapshot = await getDocs(q);
            setReferralCodeStatus(querySnapshot.empty ? 'invalid' : 'valid');
        } catch (error) {
            console.error('Error checking referral code:', error);
            setReferralCodeStatus('idle');
        } finally {
            setIsCheckingPromo(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (step === 8 && formData.hasReferralCode === 'oui' && !refCodeFromUrl) {
                checkReferralCode(formData.referralCode);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [formData.referralCode, formData.hasReferralCode, step, checkReferralCode, refCodeFromUrl]);

    const handleNextStep = useCallback(() => {
        if (!isStepValid) {
            toast({ variant: 'destructive', title: 'Veuillez remplir tous les champs correctement.' });
            return;
        }

        let nextStep = step + 1;
        if (refCodeFromUrl && step === 7) {
            nextStep = 9; 
        }

        setDirection(1); 
        if (isStepValid && step < finalTotalSteps) {
            setStep(nextStep);
        } else if (step === finalTotalSteps) {
            handleRegister();
        }
    }, [isStepValid, step, refCodeFromUrl, finalTotalSteps, toast]);

    const handlePrevStep = useCallback(() => {
        let prevStep = step - 1;
        if (refCodeFromUrl && step === 9) {
            prevStep = 7;
        }
        
        setDirection(-1);
        if (step > 1) {
            setStep(prevStep);
        } else if (step === 1) {
            setStep(0);
        }
    }, [step, refCodeFromUrl]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            handleNextStep();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            handlePrevStep();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            handleNextStep();
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [handleNextStep, handlePrevStep]);

  const handleRegister = async () => {
    if (!isStepValid) {
        toast({ variant: 'destructive', title: 'Vous devez accepter les conditions.' });
        return;
    }
    setIsLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(user);

      const birthDate = new Date(parseInt(formData.dob_year), parseInt(formData.dob_month) - 1, parseInt(formData.dob_day));
      const finalFavoriteGame = formData.favoriteGame === 'autre' ? formData.otherFavoriteGame : formData.favoriteGame;
      
      const telegramLinkToken = user.uid + '-' + Date.now();

      const batch = writeBatch(db);
      
      const userDocRef = doc(db, "users", user.uid);
      batch.set(userDocRef, {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dob: birthDate,
        username: formData.username,
        favoriteGame: finalFavoriteGame,
        referralCode: formData.referralCode,
        pronostiqueurCode: formData.pronostiqueurCode,
        createdAt: serverTimestamp(),
        isOnline: true,
        solde_referral: 0,
        telegramLinkToken: telegramLinkToken,
      });

      const pricingDocRef = doc(db, "users", user.uid, "pricing", "jetpredict");
      batch.set(pricingDocRef, {
        idplan_jetpredict: null,
        actif_jetpredict: false,
        startdate: null,
        findate: null,
      });
      
      const referralSubcollectionRef = doc(collection(userDocRef, "referral"));
      batch.set(referralSubcollectionRef, {
        amount: 0,
        fromUser: "Système",
        plan: "Initialisation",
        date: serverTimestamp()
      });

      await batch.commit();
      setDirection(1);
      setStep(finalTotalSteps + 1); 
      
    } catch (error: any) {
      console.error(error);
      let title = "Erreur d'inscription";
      if (error.code === 'auth/email-already-in-use') {
        title = "Cet e-mail est déjà utilisé.";
        toast({ variant: 'destructive', title: title });
        setStep(1);
      } else if (error.code === 'auth/invalid-email') {
          title = "Le format de l'e-mail est invalide.";
          toast({ variant: 'destructive', title: title });
          setStep(1);
      } else {
        toast({ variant: 'destructive', title: title });
      }
    } finally {
      setIsLoading(false);
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

        if (userDocSnap.exists()) {
            await updateDoc(userDocRef, { isOnline: true, photoURL: user.photoURL });
            toast({ variant: 'success', title: 'Connexion réussie' });
            router.push('/predict');
        } else {
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
                referralCode: refCodeFromUrl, 
            });
            await setDoc(doc(db, "users", user.uid, "pricing", "jetpredict"), {
                actif_jetpredict: false,
            });
            router.push('/register/google');
        }
    } catch (error: any) {
         if (error.code === 'auth/popup-closed-by-user') {
            setIsLoading(false);
            return;
        }
        console.error(error);
        toast({
            variant: 'destructive',
            title: "Erreur de connexion Google",
            description: "Veuillez réessayer.",
        });
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (step === 3 && formData.gender && isStepValid) {
        const timer = setTimeout(handleNextStep, 300);
        return () => clearTimeout(timer);
    }
}, [formData.gender, step, isStepValid, handleNextStep]);

useEffect(() => {
    if (step === 7 && formData.favoriteGame && formData.favoriteGame !== 'autre' && isStepValid) {
        const timer = setTimeout(handleNextStep, 300);
        return () => clearTimeout(timer);
    }
}, [formData.favoriteGame, step, isStepValid, handleNextStep]);

useEffect(() => {
    if (step === 6 && formData.isPronostiqueur === 'non' && isStepValid) {
        const timer = setTimeout(handleNextStep, 300);
        return () => clearTimeout(timer);
    }
}, [formData.isPronostiqueur, step, isStepValid, handleNextStep]);

useEffect(() => {
    if (step === 8 && formData.hasReferralCode === 'non' && isStepValid) {
        const timer = setTimeout(handleNextStep, 300);
        return () => clearTimeout(timer);
    }
}, [formData.hasReferralCode, step, isStepValid, handleNextStep]);

    const handleOpenMail = () => {
        const email = formData.email;
        const domain = email.split('@')[1];
        let url;

        if (domain.includes('gmail')) {
            url = 'https://mail.google.com';
        } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
            url = 'https://outlook.live.com';
        } else if (domain.includes('yahoo')) {
            url = 'https://mail.yahoo.com';
        } else if (domain.includes('icloud') || domain.includes('me.com')) {
            url = 'https://www.icloud.com/mail';
        } else {
            router.push('/login');
            return;
        }
        window.open(url, '_blank');
        router.push('/login');
    };

  const renderUsernameFeedback = () => {
    switch (usernameStatus) {
        case 'checking':
            return <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</p>;
        case 'valid':
            return <p className="text-sm text-green-500 flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Pseudo disponible !</p>;
        case 'invalid':
            return <p className="text-sm text-destructive flex items-center"><XCircle className="mr-2 h-4 w-4" /> Emojis et espaces interdits.</p>;
        case 'taken':
            return <p className="text-sm text-destructive flex items-center"><XCircle className="mr-2 h-4 w-4" /> Ce pseudo est déjà pris.</p>;
        default:
            return <p className="text-sm text-muted-foreground">Au moins 3 caractères, unique.</p>;
    }
  };

  const renderReferralCodeFeedback = () => {
      const status = referralCodeStatus;
      switch (status) {
          case 'checking':
              return <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</p>;
          case 'valid':
              return <p className="text-sm text-green-500 flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Code valide !</p>;
          case 'invalid':
              return <p className="text-sm text-destructive flex items-center"><XCircle className="mr-2 h-4 w-4" /> Ce code est invalide.</p>;
          default:
              return <p className="text-sm text-muted-foreground">Entrez un code de parrainage.</p>;
      }
  };

  const StepTitle = ({title, icon}: {title: string, icon: React.ReactNode}) => (
      <motion.div
        className="mb-8 text-center"
        initial={{ y: -20, opacity: 0}}
        animate={{ y: 0, opacity: 1}}
        transition={{ delay: 0.2 }}
      >
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 border border-primary/20 text-primary">{icon}</div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
      </motion.div>
  )

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 -z-10"></div>
       <motion.div 
            aria-hidden 
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0}}
            animate={{ opacity: 1, transition: { duration: 1 }}}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_30%,hsl(var(--primary)/0.15),transparent)]"></div>
        </motion.div>
      
      <main className="w-full max-w-sm z-10 flex-1 flex flex-col justify-center">
        {step > 0 && step <= finalTotalSteps && (
          <div className="w-full mb-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-primary">Étape {refCodeFromUrl && step > 7 ? step - 1 : step} sur {finalTotalSteps}</p>
                 <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Déjà un compte ?</Link>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(step / finalTotalSteps) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
              </div>
          </div>
        )}

        <div className="relative overflow-hidden w-full flex-1 flex items-center">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="absolute w-full"
                >
                <div className="min-h-[450px]">
                {step === 0 && (
                    <div className="text-center">
                         <motion.div 
                            className="mb-8 text-center"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                         >
                            <h1 className="text-3xl font-bold tracking-tight">Rejoignez Jet Predict</h1>
                            <p className="text-muted-foreground mt-2">Créez votre compte pour commencer.</p>
                        </motion.div>
                        <motion.div 
                            className="space-y-4"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                        >
                           <Button className="w-full h-12 text-base" size="lg" onClick={handleGoogleSignIn} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon className="mr-2 h-5 w-5"/>}
                                Continuer avec Google
                            </Button>
                             <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/50" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Ou</span>
                                </div>
                            </div>
                             <Button variant="outline" className="w-full h-12 text-base bg-card/50" size="lg" onClick={() => { setDirection(1); setStep(1); }} disabled={isLoading}>
                                <Mail className="mr-2 h-5 w-5"/>
                                S'inscrire avec un email
                            </Button>
                             <div className="pt-4 text-center text-sm text-muted-foreground">
                                Vous avez déjà un compte ?{' '}
                                <Link href="/login" className="underline text-primary">
                                    Se connecter
                                </Link>
                                </div>
                        </motion.div>
                    </div>
                )}
                {step > 0 && step <= finalTotalSteps && (
                    <div className="p-1">
                      {step === 1 && <StepTitle title="Infos de Connexion" icon={<Mail />} />}
                      {step === 2 && <StepTitle title="Votre Identité" icon={<User />} />}
                      {step === 3 && <StepTitle title="Votre Genre" icon={<VenetianMask />} />}
                      {step === 4 && <StepTitle title="Date de Naissance" icon={<Cake />} />}
                      {step === 5 && <StepTitle title="Nom d'Utilisateur" icon={<VenetianMask />} />}
                      {step === 6 && <StepTitle title="Code Pronostiqueur" icon={<ShieldCheck />} />}
                      {step === 7 && <StepTitle title="Jeu Préféré" icon={<Gamepad2 />} />}
                      {step === 8 && !refCodeFromUrl && <StepTitle title="Parrainage" icon={<User />} />}
                      {step === 9 && <StepTitle title="Finalisation" icon={<CheckCircle />} />}
                  </div>
                )}
                
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="bg-background/50 h-12"/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <div className="relative">
                            <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handlePasswordChange} required className="pr-10 bg-background/50 h-12" />
                            <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(p => !p)}>
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                       <div className="grid grid-cols-4 gap-2 pt-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("h-1 rounded-full transition-colors", Object.values(passwordValidation)[i] ? "bg-green-500" : "bg-destructive")}></div>
                          ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                       <div className="relative">
                          <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handlePasswordChange} required className="pr-10 bg-background/50 h-12" />
                           <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(p => !p)}>
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                          </button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                     <p className="text-sm text-muted-foreground text-center">Comment devrions-nous vous appeler ?</p>
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleChange} required className="bg-background/50 h-12"/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleChange} required className="bg-background/50 h-12"/>
                    </div>
                  </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Cette information nous aide à personnaliser votre expérience.</p>
                         <AnimatePresence>
                            <motion.div
                                key="gender-cards"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-3 gap-4 pt-4"
                            >
                                {['Masculin', 'Féminin', 'Autre'].map((gender, index) => {
                                    const emojis = ['👨', '👩', '👤'];
                                    return (
                                        <RadioCard key={gender} id={`gender-${gender}`} value={gender} selectedValue={formData.gender} onSelect={(val) => setFormData(p => ({...p, gender: val}))} className="h-28">
                                            <span className="text-4xl">{emojis[index]}</span>
                                            <span className="font-medium">{gender}</span>
                                        </RadioCard>
                                    )
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}


                {step === 4 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Pour vérifier que vous avez l'âge légal pour jouer.</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dob_day" className="text-xs text-muted-foreground">Jour</Label>
                                <Input id="dob_day" type="number" placeholder="JJ" value={formData.dob_day} onChange={handleChange} className="bg-background/50 h-16 text-center text-2xl"/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="dob_month" className="text-xs text-muted-foreground">Mois</Label>
                                <Input id="dob_month" type="number" placeholder="MM" value={formData.dob_month} onChange={handleChange} className="bg-background/50 h-16 text-center text-2xl"/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="dob_year" className="text-xs text-muted-foreground">Année</Label>
                                <Input id="dob_year" type="number" placeholder="AAAA" value={formData.dob_year} onChange={handleChange} className="bg-background/50 h-16 text-center text-2xl"/>
                            </div>
                        </div>
                    </div>
                )}
                
                {step === 5 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Ce sera votre identifiant unique et votre code de parrainage.</p>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Pseudo</Label>
                            <Input id="username" value={formData.username} onChange={handleChange} required className="bg-background/50 h-12"/>
                            <div className="h-5 mt-1">{renderUsernameFeedback()}</div>
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Si vous êtes pronostiqueur, entrez votre code promo affilié (ex: 1xBet).</p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <RadioCard id="pronostiqueur-oui" value="oui" selectedValue={formData.isPronostiqueur} onSelect={(val) => setFormData(p => ({...p, isPronostiqueur: val, pronostiqueurCode: ''}))} className="h-24">Oui</RadioCard>
                            <RadioCard id="pronostiqueur-non" value="non" selectedValue={formData.isPronostiqueur} onSelect={(val) => setFormData(p => ({...p, isPronostiqueur: val, pronostiqueurCode: ''}))} className="h-24">Non</RadioCard>
                        </div>
                        {formData.isPronostiqueur === 'oui' && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-2 pt-4">
                                <Label htmlFor="pronostiqueurCode">Votre Code Promo</Label>
                                <Input id="pronostiqueurCode" value={formData.pronostiqueurCode} onChange={handleChange} placeholder="VOTRE-CODE" className="bg-background/50 h-12 text-center tracking-widest font-bold"/>
                            </motion.div>
                        )}
                    </div>
                )}
                
                {step === 7 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Quel est votre type de jeu de pari favori ?</p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <RadioCard id="game-aviator" value="aviator" selectedValue={formData.favoriteGame} onSelect={(val) => setFormData(p => ({...p, favoriteGame: val}))} className="h-24"><AviatorLogo /><span className="font-semibold">Aviator</span></RadioCard>
                            <RadioCard id="game-luckyjet" value="luckyjet" selectedValue={formData.favoriteGame} onSelect={(val) => setFormData(p => ({...p, favoriteGame: val}))} className="h-24"><LuckyJetLogo /><span className="font-semibold">Lucky Jet</span></RadioCard>
                            <RadioCard id="game-paris-sportifs" value="paris-sportifs" selectedValue={formData.favoriteGame} onSelect={(val) => setFormData(p => ({...p, favoriteGame: val}))} className="h-24"><span className="text-4xl">⚽</span><span className="font-semibold">Paris Sportifs</span></RadioCard>
                            <RadioCard id="game-autre" value="autre" selectedValue={formData.favoriteGame} onSelect={(val) => setFormData(p => ({...p, favoriteGame: val, otherFavoriteGame: ''}))} className="h-24"><Gamepad2 size={32}/><span className="font-semibold">Autre</span></RadioCard>
                        </div>

                        {formData.favoriteGame === 'autre' && (
                           <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="relative pt-4 overflow-hidden">
                                <Label htmlFor="otherFavoriteGame">Nom du jeu</Label>
                                <Input id="otherFavoriteGame" value={formData.otherFavoriteGame} onChange={handleChange} placeholder="Ex: Rocket Queen" className="bg-background/50 h-12"/>
                            </motion.div>
                        )}
                    </div>
                )}


                {step === 8 && !refCodeFromUrl && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Si un ami vous a invité, entrez son pseudo ici.</p>
                         <div className="grid grid-cols-2 gap-4 pt-4">
                            <RadioCard id="referral-oui" value="oui" selectedValue={formData.hasReferralCode} onSelect={(val) => setFormData(p => ({...p, hasReferralCode: val, referralCode: ''}))} className="h-24">Oui</RadioCard>
                            <RadioCard id="referral-non" value="non" selectedValue={formData.hasReferralCode} onSelect={(val) => setFormData(p => ({...p, hasReferralCode: val, referralCode: ''}))} className="h-24">Non</RadioCard>
                        </div>
                        {formData.hasReferralCode === 'oui' && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-2 pt-4 overflow-hidden">
                                <Label htmlFor="referralCode">Pseudo du parrain</Label>
                                <Input id="referralCode" value={formData.referralCode} onChange={handleChange} className="bg-background/50 h-12"/>
                                <div className="h-5 mt-1">{renderReferralCodeFeedback()}</div>
                            </motion.div>
                        )}
                    </div>
                )}

                {step === 9 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">Dernière étape avant de décoller.</p>
                    <div className="flex items-start space-x-3 p-4 bg-card/50 border rounded-md mt-4">
                      <Checkbox id="cguAccepted" checked={formData.cguAccepted} onCheckedChange={(checked) => setFormData(p => ({...p, cguAccepted: !!checked}))} className="mt-1" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="cguAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          J'accepte les conditions générales
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Vous acceptez nos <Link href="/legal/cgu" className="underline text-primary" target="_blank">Conditions d'utilisation</Link> et <Link href="/legal/confidentialite" className="underline text-primary" target="_blank">Politique de confidentialité</Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === finalTotalSteps + 1 && (
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, transition: { type: 'spring' } }} 
                            className="flex justify-center"
                        >
                            <PartyPopper className="w-20 h-20 text-green-500" />
                        </motion.div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold leading-none tracking-tight">Inscription Réussie !</h1>
                            <p className="text-muted-foreground">Un email de vérification a été envoyé à <strong className="text-primary">{formData.email}</strong>.</p>
                        </div>
                        <p className="text-center text-muted-foreground">Consultez votre boîte mail (et vos spams) pour valider votre compte.</p>
                        <Button className="w-full" onClick={handleOpenMail}>
                            Ouvrir ma boîte mail
                        </Button>
                    </div>
                )}
                </div>
                </motion.div>
            </AnimatePresence>
        </div>
      </main>

       {step > 0 && step <= finalTotalSteps && (
        <footer className="w-full max-w-sm z-10 space-y-4 pt-4">
            <div className="flex w-full items-center gap-4">
                <Button variant="outline" onClick={handlePrevStep} className="w-full bg-card/50 h-12">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                </Button>
                {step === finalTotalSteps ? (
                    <Button onClick={handleRegister} className="w-full h-12" disabled={!isStepValid || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Créer mon compte'}
                    </Button>
                ) : (
                    <Button onClick={handleNextStep} className="w-full h-12" disabled={!isStepValid || isLoading || isCheckingUsername || isCheckingPromo}>
                        {(isLoading || isCheckingUsername || isCheckingPromo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Suivant <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </footer>
      )}
    </div>
  );
}
