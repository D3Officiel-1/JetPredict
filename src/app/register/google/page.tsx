
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, PartyPopper, XCircle, CheckCircle, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_STEPS = 4;

const NumberInputWithControls = ({ id, placeholder, value, onChange, min, max, onValueChange } : { id: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min: number, max: number, onValueChange: (newValue: number) => void }) => {
    const handleStep = (step: number) => {
        const currentValue = parseInt(value, 10) || 0;
        let newValue = currentValue + step;
        if (newValue < min) newValue = max;
        if (newValue > max) newValue = min;
        onValueChange(newValue);
    };

    return (
        <div className="relative">
            <Input id={id} type="number" placeholder={placeholder} value={value} onChange={onChange} min={min} max={max} />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col h-full justify-center">
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => handleStep(1)}>
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => handleStep(-1)}>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
};

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function RegisterGooglePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
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
          // If gender is set, profile is complete, redirect
          router.push('/predict');
          return;
      }

      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleNextStep = useCallback(() => {
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
  
    useEffect(() => {
        if (step === 1 && formData.gender && isStepValid) {
            const timer = setTimeout(() => handleNextStep(), 300);
            return () => clearTimeout(timer);
        }
    }, [formData.gender, step, isStepValid, handleNextStep]);

    useEffect(() => {
        if (step === 3 && formData.isPronostiqueur === 'non' && isStepValid) {
            const timer = setTimeout(() => handleNextStep(), 300);
            return () => clearTimeout(timer);
        }
    }, [formData.isPronostiqueur, step, isStepValid, handleNextStep]);

    useEffect(() => {
        if (step === 4 && formData.hasReferralCode === 'non' && isStepValid) {
            const timer = setTimeout(() => handleNextStep(), 300);
            return () => clearTimeout(timer);
        }
    }, [formData.hasReferralCode, step, isStepValid, handleNextStep]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDobChange = (id: 'dob_day' | 'dob_month' | 'dob_year', newValue: number) => {
    setFormData(prev => ({...prev, [id]: String(newValue)}));
  };

  const handleGenderSelect = (value: string) => {
    setFormData(p => ({ ...p, gender: value }));
  };

  const handlePronostiqueurChange = (value: string) => {
    setFormData(p => ({...p, isPronostiqueur: value, pronostiqueurCode: ''}));
  };

  const handleReferralChange = (value: string) => {
    setFormData(p => ({...p, hasReferralCode: value, referralCode: ''}));
    setReferralCodeStatus('idle');
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


  const handleNextStepWithValidation = () => {
    if (isStepValid) {
        handleNextStep();
    } else {
      toast({ variant: 'destructive', title: 'Veuillez remplir tous les champs correctement.' });
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!isStepValid || !user) {
      toast({ variant: 'destructive', title: 'Veuillez remplir tous les champs correctement.' });
      return;
    }
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const birthDate = new Date(parseInt(formData.dob_year), parseInt(formData.dob_month) - 1, parseInt(formData.dob_day));
      
      // Generate a unique token for Telegram linking
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
      setIsLoading(false);
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

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 -z-10"></div>
      <div className="absolute -bottom-2 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c22,transparent)] -z-10"></div>
      
      <header className="w-full max-w-xl flex items-center justify-between z-10">
         <Button asChild variant="ghost" disabled={true}>
            <span />
        </Button>
      </header>
      
      <main className="w-full max-w-sm z-10 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold text-primary mb-2">Étape {step} sur {TOTAL_STEPS}</p>
                    <h1 className="text-3xl font-bold tracking-tight">Complétez votre profil</h1>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Veuillez spécifier votre genre.</p>
                        <RadioGroup value={formData.gender} onValueChange={handleGenderSelect} className="grid grid-cols-3 gap-4 pt-4">
                            {['Masculin', 'Féminin', 'Autre'].map((gender, index) => {
                                const emojis = ['👨', '👩', '👤'];
                                return (
                                    <div key={gender} className="group relative">
                                        <Label htmlFor={`gender-${gender}`} className="transition-all flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary has-[:checked]:shadow-lg has-[:checked]:shadow-primary/20 has-[:checked]:bg-card">
                                            <RadioGroupItem value={gender} id={`gender-${gender}`} className="sr-only" />
                                            <span className="text-3xl">{emojis[index]}</span>
                                            <span className="font-medium">{gender}</span>
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Pour vérifier que vous avez l'âge légal.</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label htmlFor="dob_day">Jour</Label>
                                 <NumberInputWithControls id="dob_day" placeholder="JJ" value={formData.dob_day} onChange={handleChange} min={1} max={31} onValueChange={(v) => handleDobChange('dob_day', v)} />
                            </div>
                            <div>
                                <Label htmlFor="dob_month">Mois</Label>
                                 <NumberInputWithControls id="dob_month" placeholder="MM" value={formData.dob_month} onChange={handleChange} min={1} max={12} onValueChange={(v) => handleDobChange('dob_month', v)} />
                            </div>
                            <div>
                                <Label htmlFor="dob_year">Année</Label>
                                <NumberInputWithControls id="dob_year" placeholder="AAAA" value={formData.dob_year} onChange={handleChange} min={new Date().getFullYear() - 100} max={new Date().getFullYear() - 18} onValueChange={(v) => handleDobChange('dob_year', v)} />
                            </div>
                        </div>
                    </div>
                )}
                
                {step === 3 && (
                     <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Êtes-vous un pronostiqueur ? Si oui, entrez votre code promo pour des sites comme 1xBet.</p>
                        <RadioGroup value={formData.isPronostiqueur} onValueChange={handlePronostiqueurChange} className="grid grid-cols-2 gap-4 pt-4">
                             <Label htmlFor="pronostiqueur-oui" className="p-4 border rounded-md cursor-pointer has-[:checked]:border-primary text-center">
                              <RadioGroupItem value="oui" id="pronostiqueur-oui" className="sr-only" />
                              Oui
                            </Label>
                             <Label htmlFor="pronostiqueur-non" className="p-4 border rounded-md cursor-pointer has-[:checked]:border-primary text-center">
                              <RadioGroupItem value="non" id="pronostiqueur-non" className="sr-only" />
                              Non
                            </Label>
                        </RadioGroup>
                        {formData.isPronostiqueur === 'oui' && (
                            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-4 pt-4">
                                <div className="relative p-4 border-dashed border-2 border-border">
                                    <div className="flex items-center gap-4">
                                        <ShieldCheck className="text-primary h-8 w-8 shrink-0"/>
                                        <Input 
                                            id="pronostiqueurCode" 
                                            value={formData.pronostiqueurCode} 
                                            onChange={handleChange} 
                                            placeholder="VOTRE-CODE-PROMO"
                                            className="text-center tracking-widest font-bold text-lg bg-transparent border-0 h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">Avez-vous un code de parrainage ?</p>
                        <RadioGroup value={formData.hasReferralCode} onValueChange={handleReferralChange} className="grid grid-cols-2 gap-4 pt-4">
                             <Label htmlFor="referral-oui" className="p-4 border rounded-md cursor-pointer has-[:checked]:border-primary text-center">
                              <RadioGroupItem value="oui" id="referral-oui" className="sr-only" />
                              Oui
                            </Label>
                             <Label htmlFor="referral-non" className="p-4 border rounded-md cursor-pointer has-[:checked]:border-primary text-center">
                              <RadioGroupItem value="non" id="referral-non" className="sr-only" />
                              Non
                            </Label>
                        </RadioGroup>
                        {formData.hasReferralCode === 'oui' && (
                            <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="grid gap-2 overflow-hidden">
                                <Label htmlFor="referralCode">Code de parrainage</Label>
                                <Input id="referralCode" value={formData.referralCode} onChange={handleChange} />
                                <div className="h-5 mt-1">{renderReferralCodeFeedback()}</div>
                            </motion.div>
                        )}
                    </div>
                )}

            </motion.div>
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-sm z-10 space-y-4">
        <div className="flex w-full items-center gap-4">
            <Button variant="outline" onClick={handlePrevStep} className="w-1/3" disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
            </Button>
            {step === TOTAL_STEPS ? (
                <Button onClick={handleFinish} className="w-2/3" disabled={!isStepValid || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Terminer'}
                </Button>
            ) : (
                <Button onClick={handleNextStepWithValidation} className="w-2/3" disabled={!isStepValid || isLoading || isCheckingPromo}>
                    {(isLoading || isCheckingPromo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>
      </footer>
    </div>
  );
}