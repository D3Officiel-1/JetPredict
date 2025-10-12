
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, XCircle, CheckCircle, ShieldCheck, User as UserIcon, Cake, VenetianMask } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const TOTAL_STEPS = 4;

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

export default function RegisterGooglePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const [formData, setFormData] = useState({
    gender: '',
    dob_day: '',
    dob_month: '',
    dob_year: '',
    isPronostiqueur: '',
    pronostiqueurCode: '',
    hasReferralCode: '',
    referralCode: '',
  });

  const [referralCodeStatus, setReferralCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().gender) {
          router.push('/predict');
          return;
      }

      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleNextStep = useCallback(() => {
    setDirection(1);
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  }, [step]);
  
  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        return formData.gender !== '';
      case 2:
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
      case 3:
        if (formData.isPronostiqueur === 'non') return true;
        if (formData.isPronostiqueur === 'oui') return formData.pronostiqueurCode.trim() !== '';
        return false;
      case 4:
        if (formData.hasReferralCode === 'non') return true;
        if (formData.hasReferralCode === 'oui') return referralCodeStatus === 'valid';
        return false;
      default:
        return false;
    }
  }, [step, formData, referralCodeStatus]);
  
  const handleAutoNext = useCallback(() => {
    if (isStepValid) {
        const timer = setTimeout(() => handleNextStep(), 300);
        return () => clearTimeout(timer);
    }
  }, [isStepValid, handleNextStep]);

    useEffect(() => {
        if (step === 1 && formData.gender) handleAutoNext();
    }, [formData.gender, step, handleAutoNext]);

    useEffect(() => {
        if (step === 3 && formData.isPronostiqueur === 'non') handleAutoNext();
    }, [formData.isPronostiqueur, step, handleAutoNext]);

    useEffect(() => {
        if (step === 4 && formData.hasReferralCode === 'non') handleAutoNext();
    }, [formData.hasReferralCode, step, handleAutoNext]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handlePrevStep = () => {
    setDirection(-1);
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!isStepValid || !user) {
      toast({ variant: 'destructive', title: 'Veuillez remplir tous les champs correctement.' });
      return;
    }
    setIsFinishing(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const birthDate = new Date(parseInt(formData.dob_year), parseInt(formData.dob_month) - 1, parseInt(formData.dob_day));
      
      const telegramLinkToken = user.uid + '-' + Date.now();

      await updateDoc(userDocRef, {
        gender: formData.gender,
        dob: birthDate,
        pronostiqueurCode: formData.pronostiqueurCode,
        referralCode: formData.referralCode,
        telegramLinkToken: telegramLinkToken,
      });

      toast({ variant: 'success', title: 'Profil complété !' });
      router.push('/pricing');

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Impossible de sauvegarder les informations." });
    } finally {
      setIsFinishing(false);
    }
  };

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
        if (step === 4 && formData.hasReferralCode === 'oui') {
            checkReferralCode(formData.referralCode);
        }
    }, 500);

    return () => clearTimeout(handler);
  }, [formData.referralCode, formData.hasReferralCode, step, checkReferralCode]);


    const renderReferralCodeFeedback = () => {
        switch (referralCodeStatus) {
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

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }

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
        {step <= TOTAL_STEPS && (
          <div className="w-full mb-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-primary">Étape {step} sur {TOTAL_STEPS}</p>
                 <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
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
                <div className="min-h-[350px]">
                {step <= TOTAL_STEPS && (
                    <div className="p-1">
                      {step === 1 && <StepTitle title="Votre Genre" icon={<VenetianMask />} />}
                      {step === 2 && <StepTitle title="Date de Naissance" icon={<Cake />} />}
                      {step === 3 && <StepTitle title="Code Pronostiqueur" icon={<ShieldCheck />} />}
                      {step === 4 && <StepTitle title="Parrainage" icon={<UserIcon />} />}
                  </div>
                )}
                
                {step === 1 && (
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

                {step === 2 && (
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

                {step === 3 && (
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
                
                {step === 4 && (
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

                </div>
                </motion.div>
            </AnimatePresence>
        </div>
      </main>

       {step <= TOTAL_STEPS && (
        <footer className="w-full max-w-sm z-10 space-y-4 pt-4">
            <div className="flex w-full items-center gap-4">
                <Button variant="outline" onClick={handlePrevStep} className="w-full bg-card/50 h-12" disabled={step === 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                </Button>
                {step === TOTAL_STEPS ? (
                    <Button onClick={handleFinish} className="w-full h-12" disabled={!isStepValid || isFinishing}>
                        {isFinishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Terminer'}
                    </Button>
                ) : (
                    <Button onClick={() => { if(isStepValid) handleNextStep() }} className="w-full h-12" disabled={!isStepValid || isFinishing || isCheckingPromo}>
                        {(isFinishing || isCheckingPromo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Suivant <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </footer>
      )}
    </div>
  );
}

    