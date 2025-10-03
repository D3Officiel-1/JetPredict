
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuth, applyActionCode, checkActionCode, confirmPasswordReset } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, MailCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Action = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'signIn';

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

const ActionContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [mode, setMode] = useState<Action | null>(null);
    const [actionCode, setActionCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [info, setInfo] = useState<{ email?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // States for password reset
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

    useEffect(() => {
        const modeParam = searchParams.get('mode') as Action;
        const oobCodeParam = searchParams.get('oobCode');

        if (!modeParam || !oobCodeParam) {
            setError("Paramètres d'action invalides ou manquants.");
            setIsLoading(false);
            return;
        }

        setMode(modeParam);
        setActionCode(oobCodeParam);

        const handleAction = async () => {
            try {
                const actionCodeInfo = await checkActionCode(auth, oobCodeParam);
                setInfo(actionCodeInfo.data);

                if (modeParam === 'verifyEmail') {
                    await applyActionCode(auth, oobCodeParam);
                } else if (modeParam === 'resetPassword') {
                    // Just show the password reset form
                } else {
                    setError(`Action non supportée : ${modeParam}.`);
                }
            } catch (e: any) {
                console.error(e);
                let errorMessage = "Le lien est invalide ou a expiré. Veuillez réessayer.";
                if (e.code === 'auth/expired-action-code') {
                    errorMessage = "Le lien a expiré. Veuillez refaire une demande.";
                } else if (e.code === 'auth/invalid-action-code') {
                    errorMessage = "Le lien est invalide. Veuillez vérifier le lien ou refaire une demande.";
                } else if (e.code === 'auth/user-disabled') {
                    errorMessage = "Votre compte a été désactivé.";
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        handleAction();
    }, [searchParams, auth, toast]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Les mots de passe ne correspondent pas.' });
            return;
        }
        if (newPassword.length < 8) {
            toast({ variant: 'destructive', title: 'Le mot de passe doit faire au moins 8 caractères.' });
            return;
        }
        if (!actionCode) return;

        setIsProcessing(true);
        try {
            await confirmPasswordReset(auth, actionCode, newPassword);
            setPasswordResetSuccess(true);
            toast({ variant: 'success', title: 'Votre mot de passe a été réinitialisé.' });
        } catch (e: any) {
            console.error(e);
            let errorMessage = "Une erreur est survenue. Le lien a peut-être expiré.";
            if (e.code === 'auth/expired-action-code') {
                errorMessage = "Le lien a expiré. Veuillez refaire une demande.";
            }
             toast({ variant: 'destructive', title: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-center"
            >
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Vérification en cours...</h1>
                <p className="text-muted-foreground">Nous traitons votre demande.</p>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="w-full max-w-md text-center p-8 bg-card/50 backdrop-blur-lg border border-destructive/20 rounded-2xl shadow-2xl shadow-destructive/10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={iconVariants} className="flex justify-center mb-6">
                    <ShieldAlert className="w-24 h-24 text-destructive drop-shadow-[0_0_15px_hsl(var(--destructive))]"/>
                </motion.div>
                <h1 className="text-3xl font-bold text-destructive mb-2">Action Échouée</h1>
                <p className="text-muted-foreground mb-8">{error}</p>
                <Button asChild className="w-full">
                    <Link href="/login">Retour à la connexion</Link>
                </Button>
            </motion.div>
        );
    }
    
    if (mode === 'verifyEmail') {
        return (
             <motion.div 
                className="w-full max-w-md text-center p-8 bg-card/50 backdrop-blur-lg border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={iconVariants} className="flex justify-center mb-6">
                    <MailCheck className="w-24 h-24 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/>
                </motion.div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Email Vérifié !</h1>
                <p className="text-muted-foreground mb-8">
                    Merci d'avoir vérifié <strong className="text-primary">{info?.email}</strong>.
                    Vous pouvez maintenant accéder à nos forfaits.
                </p>
                <Button asChild className="w-full">
                    <Link href="/pricing">Choisir un forfait</Link>
                </Button>
            </motion.div>
        );
    }
    
    if (mode === 'resetPassword') {
        if (passwordResetSuccess) {
            return (
                 <motion.div 
                    className="w-full max-w-md text-center p-8 bg-card/50 backdrop-blur-lg border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={iconVariants} className="flex justify-center mb-6">
                        <KeyRound className="w-24 h-24 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/>
                    </motion.div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Mot de passe réinitialisé !</h1>
                    <p className="text-muted-foreground mb-8">
                       Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/login">Aller à la connexion</Link>
                    </Button>
                </motion.div>
            );
        }
        
        return (
             <motion.div 
                className="w-full max-w-md p-8 bg-card/50 backdrop-blur-lg border border-border/20 rounded-2xl shadow-2xl shadow-primary/10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
             >
                <form onSubmit={handlePasswordReset}>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground">Nouveau mot de passe</h1>
                        <p className="text-muted-foreground mt-2">
                            Créez un nouveau mot de passe pour <strong className="text-primary">{info?.email}</strong>.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <div className="relative flex items-center">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="bg-background/50 pr-10"
                                />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                             <div className="relative flex items-center">
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-background/50 pr-10"
                                />
                                 <Button type="button" variant="ghost" size="icon" className="absolute right-1 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </Button>
                            </div>
                        </div>
                         <Button type="submit" className="w-full" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Réinitialiser le mot de passe
                        </Button>
                    </div>
                </form>
            </motion.div>
        );
    }

    return null;
}

export default function ActionsPage() {
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
            
            <Suspense fallback={<Loader2 className="w-12 h-12 animate-spin text-primary" />}>
                <ActionContent />
            </Suspense>
        </div>
    );
}
