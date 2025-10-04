
'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail, deleteUser } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, KeyRound, Mail, Trash2, LogOut, Palette, Loader2, ShieldAlert, Eye, EyeOff, Download, Bell, Vibrate, Music } from 'lucide-react';
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


const InstallStep = ({ num, instruction, detail }: { num: number, instruction: React.ReactNode, detail: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shrink-0 mt-1">
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

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<'email' | 'password' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const { theme, setTheme } = useTheme();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroidInstallGuideOpen, setIsAndroidInstallGuideOpen] = useState(false);
  const [isIosInstallGuideOpen, setIsIosInstallGuideOpen] = useState(false);
  const [isWindowsInstallGuideOpen, setIsWindowsInstallGuideOpen] = useState(false);

  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();

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
      setIsAndroidInstallGuideOpen(true);
    }
  };

  const handleIosInstallClick = () => setIsIosInstallGuideOpen(true);
  
  const handleWindowsInstallClick = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    } else {
        setIsWindowsInstallGuideOpen(true);
    }
  };

  useEffect(() => {
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
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
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
                <CardTitle>Préférences de Notification</CardTitle>
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
                <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="text-primary"><Palette size={24} /></div>
                        <div>
                            <h3 className="font-semibold text-foreground">Thème de l'interface</h3>
                            <p className="text-sm text-muted-foreground">Choisissez une apparence.</p>
                        </div>
                    </div>
                    <div className="pl-4">
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Changer de thème" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Clair</SelectItem>
                                <SelectItem value="dark">Sombre</SelectItem>
                                <SelectItem value="system">Système</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <div className="text-primary"><Download size={24} /></div>
                        <div>
                            <h3 className="font-semibold text-foreground">Installer l'application</h3>
                            <p className="text-sm text-muted-foreground">Accès rapide depuis votre bureau/accueil.</p>
                        </div>
                    </div>
                    <div className="pl-4">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-start">
                            <button onClick={handleAndroidInstallClick} className="cursor-pointer" title="Installer sur Android">
                                <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Download on Google Play" width={35} height={35} className={cn("dark:invert-0 invert")}/>
                            </button>
                            <button onClick={handleIosInstallClick} className="cursor-pointer" title="Installer sur iOS">
                                <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="Download on the App Store" width={35} height={35} className={cn("dark:invert-0 invert")}/>
                            </button>
                             <button onClick={handleWindowsInstallClick} className="cursor-pointer" title="Installer sur Ordinateur">
                                <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Download for Windows" width={35} height={35} />
                            </button>
                        </div>
                    </div> 
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-card/70 backdrop-blur-sm border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert />Zone de Danger</CardTitle>
                <CardDescription>Ces actions sont irréversibles.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="flex items-center justify-between p-4 border-b border-destructive/20">
                    <div className="flex items-center gap-4">
                        <div className="text-destructive"><LogOut size={24} /></div>
                        <div>
                            <h3 className="font-semibold text-foreground">Se déconnecter</h3>
                            <p className="text-sm text-muted-foreground">Mettre fin à votre session.</p>
                        </div>
                    </div>
                    <div className="pl-4">
                        <Button variant="outline" onClick={handleLogout}>Déconnexion</Button>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <div className="text-destructive"><Trash2 size={24} /></div>
                        <div>
                            <h3 className="font-semibold text-foreground">Supprimer mon compte</h3>
                            <p className="text-sm text-muted-foreground">Vos données seront effacées.</p>
                        </div>
                    </div>
                    <div className="pl-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Supprimer</Button>
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
                                        <Input id="delete-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10" />
                                        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            </CardContent>
        </Card>
      </main>

      <Dialog open={isModalOpen === 'password'} onOpenChange={(open) => !open && setIsModalOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer de mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10"/>
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPassword(p => !p)}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10"/>
                 <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPassword(p => !p)}>
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
               <div className="relative">
                <Input id="confirm-password" type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10"/>
                 <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPassword(p => !p)}>
                    {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
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
              <div className="relative flex items-center">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                  <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouvel@email.com" className="pl-10 bg-background/50"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-password" className="font-semibold text-muted-foreground">Mot de passe actuel</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                <Input id="email-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-background/50" />
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                         <Image src="https://1win-partners.com/panel/assets/images/android-BwQlK3Xs.svg" alt="Android" width={24} height={24} className={cn("dark:invert-0 invert")}/>
                        Guide d'installation pour Android
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm py-4">
                    <InstallStep 
                        num={1}
                        instruction={<>Ouvrez le menu du navigateur</>}
                        detail="Appuyez sur l'icône de menu (généralement 3 points) en haut à droite de Chrome."
                    />
                     <InstallStep 
                        num={2}
                        instruction={<>Sélectionnez <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Installer l'application</span></>}
                        detail="Cette option ajoutera JetPredict à votre écran d'accueil."
                    />
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isIosInstallGuideOpen} onOpenChange={setIsIosInstallGuideOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image src="https://1win-partners.com/panel/assets/images/ios-LCbvsU86.svg" alt="iOS" width={24} height={24} className={cn("dark:invert-0 invert")}/>
                        Guide d'installation pour iOS
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm py-4">
                    <InstallStep 
                        num={1}
                        instruction={<>Ouvrez le menu de partage</>}
                        detail="Appuyez sur l'icône de Partage (un carré avec une flèche vers le haut) dans Safari."
                    />
                     <InstallStep 
                        num={2}
                        instruction={<>Sélectionnez <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Sur l'écran d'accueil</span></>}
                        detail="Faites défiler la liste des options et appuyez sur ce bouton."
                    />
                    <InstallStep 
                        num={3}
                        instruction={<>Confirmez l'ajout</>}
                        detail="Appuyez sur 'Ajouter' en haut à droite pour finaliser l'installation."
                    />
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isWindowsInstallGuideOpen} onOpenChange={setIsWindowsInstallGuideOpen}>
            <DialogContent>
                <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                        <Image src="https://i.postimg.cc/g0zDTFgZ/windows.png" alt="Windows" width={24} height={24} />
                        Guide d'installation pour Ordinateur
                    </DialogTitle>
                </DialogHeader>
                 <div className="space-y-4 text-sm py-4">
                    <InstallStep 
                        num={1}
                        instruction={<>Trouvez l'icône d'installation</>}
                        detail="Cherchez l'icône d'installation (un écran avec une flèche) dans la barre d'adresse de votre navigateur (Chrome, Edge)."
                    />
                     <InstallStep 
                        num={2}
                        instruction={<>Cliquez sur <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Installer</span></>}
                        detail="Confirmez l'installation lorsque la fenêtre pop-up apparaît."
                    />
                    <p className="text-xs text-muted-foreground pt-2">Alternativement, vous pouvez ouvrir le menu du navigateur (⋮) et sélectionner "Installer JetPredict".</p>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
