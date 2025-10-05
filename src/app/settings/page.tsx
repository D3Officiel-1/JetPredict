

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail, deleteUser } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, KeyRound, Mail, Trash2, LogOut, Palette, Loader2, ShieldAlert, Eye, EyeOff, Download, Bell, Vibrate, Music, Sun, Moon, Laptop, MoreVertical, Share2, Smartphone, MonitorDown, CheckCircle, AppWindow, Compass } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const SettingItem = ({ icon, title, description, action, disabled = false }: { icon: React.ReactNode, title: string, description: string, action: React.ReactNode, disabled?: boolean }) => (
  <div className={cn(
      "flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 transition-all duration-300",
      disabled && "opacity-50 pointer-events-none"
  )}>
    <div className="flex items-center gap-4">
      <div className="text-primary">{icon}</div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="pl-4">
      {action}
    </div>
  </div>
);


const InstallStep = ({ num, instruction, detail }: { num: string, instruction: React.ReactNode, detail: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 shrink-0 mt-1 font-bold text-lg">
            {num}
        </div>
        <div>
            <div className="font-semibold text-foreground">{instruction}</div>
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    </div>
)

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
}

interface NotificationSettings {
    alertsEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}

const loadingTexts = [
    "ANALYSE DU PROFIL...",
    "VÉRIFICATION DES ACCÈS...",
    "SYNCHRONISATION AU NOYAU...",
    "PROTOCOLES CHARGÉS.",
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'email' | 'password' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
      alertsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
  });

  const [isFabEnabled, setIsFabEnabled] = useState(true);

  const { theme, setTheme } = useTheme();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroidInstallGuideOpen, setIsAndroidInstallGuideOpen] = useState(false);
  const [isIosInstallGuideOpen, setIsIosInstallGuideOpen] = useState(false);
  const [isWindowsInstallGuideOpen, setIsWindowsInstallGuideOpen] = useState(false);
  const [androidGuideStep, setAndroidGuideStep] = useState(1);
  const [iosGuideStep, setIosGuideStep] = useState(1);
  const [windowsGuideStep, setWindowsGuideStep] = useState(1);

  const androidImages = [
    'https://i.postimg.cc/RVFmN3Gm/android-etape-1.png',
    'https://i.postimg.cc/xC5rdYzR/android-etape-2.png',
    'https://i.postimg.cc/tCfKJBYK/android-etape-3.png',
  ];

  const iosImages = [
    'https://i.postimg.cc/XYbT9pkn/apple-etape-1.png',
    'https://i.postimg.cc/5t9TkTGF/apple-etape-2.png',
    'https://i.postimg.cc/HW8KKQSV/apple-etape-3.png',
  ];
  
  const windowsImages = [
    'https://i.postimg.cc/5yJwsd7Z/ordinateur-etape-1.png',
    'https://i.postimg.cc/gkYVRp63/ordinaeur-etape-2.png',
  ];

  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();

   useEffect(() => {
    if (isLoading) {
        const textInterval = setInterval(() => {
            setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
        }, 500);
        return () => clearInterval(textInterval);
    }
  }, [isLoading])

   useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleAndroidInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setAndroidGuideStep(1);
      setIsAndroidInstallGuideOpen(true);
    }
  };

  const handleIosInstallClick = () => {
      setIosGuideStep(1);
      setIsIosInstallGuideOpen(true);
  };
  
  const handleWindowsInstallClick = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    } else {
        setWindowsGuideStep(1);
        setIsWindowsInstallGuideOpen(true);
    }
  };

  useEffect(() => {
    try {
        const savedFabStateRaw = localStorage.getItem('fabState');
        if (savedFabStateRaw) {
            const parsedState = JSON.parse(savedFabStateRaw);
            if (typeof parsedState.isDisabled === 'boolean') {
                 setIsFabEnabled(!parsedState.isDisabled);
            }
        }
    } catch(e) { console.error("Failed to parse FAB state from localStorage", e); }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      if (!currentUser.emailVerified) {
          router.push('/verify-email');
          return;
      }
      setUser(currentUser);

      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
            const data = userDoc.data();
            setNotificationSettings({
                alertsEnabled: data.notificationSettings?.alertsEnabled ?? true,
                soundEnabled: data.notificationSettings?.soundEnabled ?? true,
                vibrationEnabled: data.notificationSettings?.vibrationEnabled ?? true,
            });
        }
      });
      
      const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
      const unsubscribePricing = onSnapshot(pricingDocRef, async (pricingDoc) => {
        if (pricingDoc.exists()) {
            const pricingData = pricingDoc.data();
            const isStillActive = pricingData.actif_jetpredict === true;
            const expirationDate = pricingData.findate?.toDate();

            if (isStillActive && expirationDate && expirationDate < new Date()) {
                await updateDoc(pricingDocRef, { actif_jetpredict: false });
                router.push('/pricing');
            } else if (!isStillActive) {
                router.push('/pricing');
            }
        } else {
          router.push('/pricing');
        }
         setIsLoading(false);
      }, (error) => {
        console.error("Erreur de lecture:", error);
        router.push('/login');
      });

      return () => {
          unsubscribeUser();
          unsubscribePricing();
      };
    });
    return () => unsubscribe();
  }, [auth, router]);
  
  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
      if (!user) return;
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { notificationSettings: newSettings });
      } catch (error) {
          console.error("Failed to update settings:", error);
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le paramètre.' });
          // Revert UI change on failure
          setNotificationSettings(s => ({...s, [key]: !value}));
      }
  };

  const handleFabEnabledChange = (enabled: boolean) => {
      setIsFabEnabled(enabled);
      try {
          const currentStateRaw = localStorage.getItem('fabState');
          const currentState = currentStateRaw ? JSON.parse(currentStateRaw) : {};
          const newState = { ...currentState, isDisabled: !enabled };
          localStorage.setItem('fabState', JSON.stringify(newState));
          window.dispatchEvent(new CustomEvent('fabstate-change'));
      } catch(e) {
          console.error("Failed to update FAB state in localStorage", e);
      }
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false });
    }
    await auth.signOut();
    router.push('/login');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (!user || !user.email) return;

    setIsProcessing(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
      toast({ variant: 'success', title: 'Succès', description: 'Mot de passe mis à jour.' });
      setIsModalOpen(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Mot de passe actuel incorrect.' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleChangeEmail = async () => {
    if (!user || !user.email) return;
    
    setIsProcessing(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updateEmail(user, newEmail);
      toast({ variant: 'success', title: 'Succès', description: 'Email mis à jour. Veuillez vous reconnecter.' });
      auth.signOut();
      router.push('/login');
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erreur', description: 'Mot de passe incorrect ou erreur.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    setIsProcessing(true);
    try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
        await deleteUser(user);
        toast({ variant: 'success', title: 'Compte supprimé', description: 'Votre compte a été supprimé.' });
        router.push('/');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Mot de passe incorrect ou suppression échouée."});
    } finally {
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isModalOpen === null) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewEmail('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isModalOpen])


  if (isLoading || !user) {
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground mt-2">Gérez les informations et les préférences de votre compte.</p>
        </div>
        
        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle>Panneau de Contrôle Sensoriel</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
                <SettingItem 
                    icon={<Bell size={24} />} 
                    title="Alertes de prédiction" 
                    description="Recevoir une alerte 30s avant un crash." 
                    action={<Switch checked={notificationSettings.alertsEnabled} onCheckedChange={(c) => handleSettingChange('alertsEnabled', c)} />} 
                />
                <SettingItem 
                    icon={<Music size={24} />} 
                    title="Son des alertes" 
                    description="Activer le son pour les notifications." 
                    action={<Switch checked={notificationSettings.soundEnabled} onCheckedChange={(c) => handleSettingChange('soundEnabled', c)} />} 
                    disabled={!notificationSettings.alertsEnabled}
                />
                <SettingItem 
                    icon={<Vibrate size={24} />} 
                    title="Vibration des alertes" 
                    description="Activer la vibration pour les notifications." 
                    action={<Switch checked={notificationSettings.vibrationEnabled} onCheckedChange={(c) => handleSettingChange('vibrationEnabled', c)} />} 
                    disabled={!notificationSettings.alertsEnabled}
                />
            </CardContent>
        </Card>

        <Card className="relative bg-card/70 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
            <CardHeader>
                <CardTitle>Terminal d'Authentification</CardTitle>
                <CardDescription>Gérez vos identifiants de connexion.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
                 <div
                    className="group relative flex items-center gap-4 rounded-lg bg-muted/30 p-4 border border-border/30 transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20"><Mail size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Changer d'adresse e-mail</h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                     <button
                        onClick={() => setIsModalOpen('email')}
                        className="font-bold text-sm text-primary opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                        Modifier
                    </button>
                </div>

                <div
                     className="group relative flex items-center gap-4 rounded-lg bg-muted/30 p-4 border border-border/30 transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20"><KeyRound size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Changer de mot de passe</h3>
                        <p className="text-sm text-muted-foreground">Utilisez un mot de passe fort et unique.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen('password')}
                        className="font-bold text-sm text-primary opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                        Modifier
                    </button>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle>Contrôle de l'Interface</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div>
                     <div className="flex items-center gap-2 ml-1 mb-2">
                        <Label className="text-sm font-semibold text-muted-foreground">Thème de l'Application</Label>
                        <Badge variant="destructive" className="scale-75">Bêta</Badge>
                     </div>
                     <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2 border border-border/30">
                        <Button variant={theme === 'light' ? 'default' : 'ghost'} onClick={() => setTheme('light')} className="flex-col h-16 gap-1">
                            <Sun className="h-5 w-5"/>
                            <span>Clair</span>
                        </Button>
                         <Button variant={theme === 'dark' ? 'default' : 'ghost'} onClick={() => setTheme('dark')} className="flex-col h-16 gap-1">
                            <Moon className="h-5 w-5"/>
                            <span>Sombre</span>
                        </Button>
                         <Button variant={theme === 'system' ? 'default' : 'ghost'} onClick={() => setTheme('system')} className="flex-col h-16 gap-1">
                            <Laptop className="h-5 w-5"/>
                            <span>Système</span>
                        </Button>
                     </div>
                </div>
                 <SettingItem 
                    icon={<Compass size={24} />} 
                    title="Bouton d'actions rapides" 
                    description="Afficher le bouton flottant sur l'application." 
                    action={<Switch checked={isFabEnabled} onCheckedChange={handleFabEnabledChange} />} 
                />
                <div>
                    <Label className="text-sm font-semibold text-muted-foreground ml-1 mb-2 block">Installer l'Application</Label>
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-4 border border-border/30 items-end">
                        <button onClick={handleAndroidInstallClick} className="flex flex-col items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                            <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Android" width={40} height={40} />
                            <span>Android</span>
                        </button>
                        <button onClick={handleIosInstallClick} className="flex flex-col items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                            <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="iOS" width={40} height={40} className="dark:invert-0 invert"/>
                             <span>iOS</span>
                        </button>
                         <button onClick={handleWindowsInstallClick} className="flex flex-col items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                            <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Desktop" width={40} height={40}/>
                             <span>Desktop</span>
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="relative p-6 bg-red-500/5 dark:bg-red-950/50 border border-destructive/20 dark:border-red-500/30 rounded-2xl overflow-hidden shadow-lg shadow-red-500/10 group">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
            
            <div className="text-center mb-6">
                <h3 className="font-mono uppercase tracking-widest text-destructive dark:text-red-400"> // Zone de Danger //</h3>
                <p className="text-sm text-destructive/70 dark:text-red-400/60">Actions irréversibles. Procéder avec prudence.</p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-background/30 rounded-lg border border-destructive/20 dark:border-red-500/20">
                    <div className="flex items-center gap-3">
                        <LogOut className="h-6 w-6 text-destructive dark:text-red-400"/>
                        <div>
                            <h4 className="font-semibold text-foreground">Terminer la session</h4>
                            <p className="text-sm text-destructive/80 dark:text-red-400/70">Mettre fin à votre session active.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="border-destructive/50 text-destructive dark:border-red-500/50 dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-500/10 dark:hover:text-red-300 w-full sm:w-auto">
                        Déconnexion
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-background/30 rounded-lg border border-destructive/20 dark:border-red-500/20">
                    <div className="flex items-center gap-3">
                        <Trash2 className="h-6 w-6 text-destructive dark:text-red-400"/>
                        <div>
                            <h4 className="font-semibold text-foreground">Supprimer le compte</h4>
                            <p className="text-sm text-destructive/80 dark:text-red-400/70">Effacement permanent des données.</p>
                        </div>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" className="bg-destructive/90 dark:bg-red-600/80 hover:bg-destructive dark:hover:bg-red-600 text-white w-full sm:w-auto">
                                Initier Suppression
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Votre compte, abonnements et données seront supprimés définitivement.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="delete-password">Entrez votre mot de passe pour confirmer :</Label>
                                <div className="relative">
                                    <Input id="delete-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10 bg-background/50" />
                                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                                        {showCurrentPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>
                            <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setCurrentPassword('')}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} disabled={isProcessing || !currentPassword}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmer la suppression
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
      </main>

      <Dialog open={isModalOpen === 'password'} onOpenChange={(open) => !open && setIsModalOpen(null)}>
        <DialogContent className="bg-card/90 backdrop-blur-sm border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <KeyRound className="text-primary"/>
                Mise à Jour de Sécurité
            </DialogTitle>
            <DialogDescription>
                Créez un nouveau mot de passe pour sécuriser votre compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="current-password" className="font-semibold text-muted-foreground">Mot de passe actuel</Label>
                <div className="relative">
                    <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-background/50" />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                    <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-password" className="font-semibold text-muted-foreground">Nouveau mot de passe</Label>
                <div className="relative">
                    <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau secret" className="pl-10 pr-10 bg-background/50"/>
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                     <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPassword(p => !p)}>
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-semibold text-muted-foreground">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                    <Input id="confirm-password" type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer le secret" className="pl-10 pr-10 bg-background/50"/>
                     <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                     <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPassword(p => !p)}>
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(null)}>Annuler</Button>
            <Button onClick={handleChangePassword} disabled={isProcessing || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isModalOpen === 'email'} onOpenChange={(open) => !open && setIsModalOpen(null)}>
        <DialogContent className="bg-card/90 backdrop-blur-sm border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Mail className="text-primary"/>
                Reconfiguration d'Identité
            </DialogTitle>
            <DialogDescription>
                Entrez votre nouvelle adresse e-mail et confirmez avec votre mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="space-y-2">
              <Label htmlFor="new-email" className="font-semibold text-muted-foreground">Nouvel Email</Label>
              <div className="relative">
                  <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouvel@email.com" className="pl-10 bg-background/50"/>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-password" className="font-semibold text-muted-foreground">Mot de passe actuel</Label>
              <div className="relative">
                <Input id="email-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-background/50" />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                    {showCurrentPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(null)} className="w-full sm:w-auto">Annuler</Button>
            <Button onClick={handleChangeEmail} disabled={isProcessing || !currentPassword || !newEmail} className="w-full sm:w-auto">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isAndroidInstallGuideOpen} onOpenChange={setIsAndroidInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Android" width={28} height={28} />
                        Protocole d'Installation : Android
                    </DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                    <div className="space-y-6 text-sm">
                        <div onClick={() => setAndroidGuideStep(1)} className={cn("p-2 rounded-lg cursor-pointer", androidGuideStep === 1 && "bg-muted")}>
                            <InstallStep
                                num="1"
                                instruction={<>Ouvrez le menu du navigateur</>}
                                detail="Dans Chrome, appuyez sur l'icône de menu (généralement 3 points) en haut à droite pour afficher les options."
                            />
                        </div>
                        <div onClick={() => setAndroidGuideStep(2)} className={cn("p-2 rounded-lg cursor-pointer", androidGuideStep === 2 && "bg-muted")}>
                            <InstallStep
                                num="2"
                                instruction={<>Sélectionnez "Installer l'application"</>}
                                detail="Cette action ajoutera Jet Predict à votre écran d'accueil, vous donnant un accès direct comme une application native."
                            />
                        </div>
                        <div onClick={() => setAndroidGuideStep(3)} className={cn("p-2 rounded-lg cursor-pointer", androidGuideStep === 3 && "bg-muted")}>
                            <InstallStep
                                num="3"
                                instruction={<>Confirmez et lancez</>}
                                detail="Validez l'installation. L'icône Jet Predict apparaîtra parmi vos autres applications. Profitez de l'expérience optimisée !"
                            />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={androidGuideStep}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image src={androidImages[androidGuideStep - 1]} alt={`Android Étape ${androidGuideStep}`} width={200} height={400} className="rounded-lg" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>


        <Dialog open={isIosInstallGuideOpen} onOpenChange={setIsIosInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="iOS" width={28} height={28} className="dark:invert-0 invert"/>
                        Protocole d'Installation : iOS
                    </DialogTitle>
                </DialogHeader>
                 <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                    <div className="space-y-6 text-sm">
                         <div onClick={() => setIosGuideStep(1)} className={cn("p-2 rounded-lg cursor-pointer", iosGuideStep === 1 && "bg-muted")}>
                            <InstallStep 
                                num="1"
                                instruction={<>Ouvrez le menu de partage</>}
                                detail="Dans Safari, appuyez sur l'icône de Partage (un carré avec une flèche vers le haut) située dans la barre de navigation."
                            />
                        </div>
                         <div onClick={() => setIosGuideStep(2)} className={cn("p-2 rounded-lg cursor-pointer", iosGuideStep === 2 && "bg-muted")}>
                            <InstallStep 
                                num="2"
                                instruction={<>Sélectionnez "Sur l'écran d'accueil"</>}
                                detail="Faites défiler la liste des options de partage vers le bas et appuyez sur ce bouton pour créer un raccourci d'application."
                            />
                        </div>
                         <div onClick={() => setIosGuideStep(3)} className={cn("p-2 rounded-lg cursor-pointer", iosGuideStep === 3 && "bg-muted")}>
                            <InstallStep 
                                num="3"
                                instruction={<>Confirmez l'ajout</>}
                                detail="Vérifiez le nom de l'application et appuyez sur 'Ajouter' en haut à droite pour finaliser l'installation sur votre appareil."
                            />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={iosGuideStep}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image src={iosImages[iosGuideStep - 1]} alt={`iOS Étape ${iosGuideStep}`} width={200} height={400} className="rounded-lg" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isWindowsInstallGuideOpen} onOpenChange={setIsWindowsInstallGuideOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20">
                <DialogHeader>
                     <DialogTitle className="flex items-center gap-2 text-xl">
                        <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Windows" width={28} height={28} />
                        Protocole d'Installation : Ordinateur
                    </DialogTitle>
                </DialogHeader>
                 <div className="grid md:grid-cols-2 gap-8 p-1 pt-4">
                     <div className="space-y-6 text-sm">
                        <div onClick={() => setWindowsGuideStep(1)} className={cn("p-2 rounded-lg cursor-pointer", windowsGuideStep === 1 && "bg-muted")}>
                            <InstallStep
                                num="1"
                                instruction={<>Trouvez l'icône d'installation</>}
                                detail="Dans la barre d'adresse de votre navigateur (Chrome, Edge), cherchez une icône représentant un écran avec une flèche vers le bas."
                            />
                        </div>
                        <div onClick={() => setWindowsGuideStep(2)} className={cn("p-2 rounded-lg cursor-pointer", windowsGuideStep === 2 && "bg-muted")}>
                             <InstallStep 
                                num="2"
                                instruction={<>Cliquez sur "Installer"</>}
                                detail="Une petite fenêtre apparaîtra pour vous proposer d'installer l'application. Cliquez sur le bouton 'Installer' pour confirmer."
                            />
                        </div>
                         <p className="text-xs text-muted-foreground pt-2 pl-14">Alternativement, ouvrez le menu du navigateur (⋮) et sélectionnez "Installer Jet Predict".</p>
                    </div>
                     <div className="hidden md:flex items-center justify-center bg-muted/30 rounded-lg p-4 border border-border/30 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={windowsGuideStep}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image src={windowsImages[windowsGuideStep - 1]} alt={`Windows Étape ${windowsGuideStep}`} width={300} height={150} className="rounded-lg border border-border" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
