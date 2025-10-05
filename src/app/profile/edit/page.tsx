

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, CheckCircle, XCircle, User as UserIcon, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/ui/sidebar';
import { AnimatePresence, motion } from 'framer-motion';

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  favoriteGame: string;
  otherFavoriteGame: string;
}

const FormRow = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3 w-full sm:w-1/3 shrink-0">
            <div className="text-primary">{icon}</div>
            <Label className="text-base sm:text-sm font-semibold whitespace-nowrap">{label}</Label>
        </div>
        <div className="w-full sm:w-2/3">
            {children}
        </div>
    </div>
);


export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    username: '',
    favoriteGame: '',
    otherFavoriteGame: '',
  });
  const [initialUsername, setInitialUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'taken'>('idle');

  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
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
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          let favoriteGame = data.favoriteGame || '';
          let otherFavoriteGame = '';
          const predefinedGames = ['aviator', 'luckyjet', 'paris-sportifs'];
          if (favoriteGame && !predefinedGames.includes(favoriteGame)) {
              otherFavoriteGame = favoriteGame;
              favoriteGame = 'autre';
          }


          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            favoriteGame: favoriteGame,
            otherFavoriteGame: otherFavoriteGame,
          });
          setInitialUsername(data.username || '');
          if (data.username) setUsernameStatus('valid');
        }
        setIsLoading(false);
      });
    });
    return () => unsubscribeAuth();
  }, [auth, router]);
  
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }
    
    if (username === initialUsername) {
        setUsernameStatus('valid');
        return;
    }

    const invalidCharsRegex = /[\s\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (invalidCharsRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      setUsernameStatus(querySnapshot.empty ? 'valid' : 'taken');
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus('idle');
    }
  }, [initialUsername]);

  useEffect(() => {
    const handler = setTimeout(() => {
      checkUsername(formData.username);
    }, 500);
    return () => clearTimeout(handler);
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (field: keyof UserData, value: string) => {
      setFormData(p => ({...p, [field]: value}));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || usernameStatus !== 'valid') {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: "Formulaire invalide. Vérifiez le pseudo.",
        });
        return;
    }

    setIsSaving(true);
    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);
        
        const finalFavoriteGame = formData.favoriteGame === 'autre' ? formData.otherFavoriteGame : formData.favoriteGame;

        const usernameChanged = formData.username !== initialUsername;
        if (usernameChanged && initialUsername) {
            const referralsQuery = query(collection(db, "users"), where("referralCode", "==", initialUsername));
            const referralsSnapshot = await getDocs(referralsQuery);
            referralsSnapshot.forEach((referralDoc) => {
                const referralRef = doc(db, "users", referralDoc.id);
                batch.update(referralRef, { referralCode: formData.username });
            });
        }
        
        batch.update(userDocRef, { 
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            favoriteGame: finalFavoriteGame
        });

        await batch.commit();

        toast({
            variant: 'success',
            title: 'Profil mis à jour',
            description: 'Vos informations ont été enregistrées.',
        });
        router.push('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'La mise à jour a échoué.',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderUsernameFeedback = () => {
    const messages = {
        checking: { icon: <Loader2 className="animate-spin" />, text: 'Vérification...', color: 'text-muted-foreground' },
        valid: { icon: <CheckCircle />, text: 'Disponible', color: 'text-green-500' },
        invalid: { icon: <XCircle />, text: 'Caractères non valides', color: 'text-destructive' },
        taken: { icon: <XCircle />, text: 'Déjà pris', color: 'text-destructive' },
        idle: { icon: null, text: '', color: ''},
    };
    
    const currentStatus = formData.username.length < 3 ? 'idle' : usernameStatus;
    const { icon, text, color } = messages[currentStatus] || messages.idle;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStatus}
                className={`flex items-center gap-1 text-xs ${color}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
            >
                {icon} {text}
            </motion.div>
        </AnimatePresence>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png" alt="Loading..." width={100} height={100} className="animate-pulse" />
        <p className="mt-4 text-muted-foreground">Chargement des informations...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <form onSubmit={handleSave} className="relative bg-card/70 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg">
                 <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>

                <div className="p-6 border-b border-border/50">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3"><UserIcon />Modifier le Profil</h2>
                    <p className="text-muted-foreground text-sm mt-1">Mettez à jour vos informations personnelles ici.</p>
                </div>
                
                <div className="p-6 space-y-8">
                    <FormRow icon={<UserIcon size={20} />} label="Nom Complet">
                       <div className="grid grid-cols-2 gap-4">
                          <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Prénom" className="bg-background/50"/>
                          <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Nom" className="bg-background/50"/>
                       </div>
                    </FormRow>
                    
                    <FormRow icon={<UserIcon size={20} />} label="Pseudo">
                       <div className="flex items-center gap-2">
                         <Input id="username" value={formData.username} onChange={handleChange} placeholder="Votre pseudo unique" className="bg-background/50"/>
                         <div className="w-32 text-right">{renderUsernameFeedback()}</div>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1.5 pl-1">Sera utilisé comme code de parrainage. Sans espaces/emojis.</p>
                    </FormRow>

                    <FormRow icon={<Gamepad2 size={20} />} label="Jeu Préféré">
                        <div className="space-y-2">
                            <Select value={formData.favoriteGame} onValueChange={(value) => handleSelectChange('favoriteGame', value)}>
                                <SelectTrigger className="bg-background/50">
                                    <SelectValue placeholder="Sélectionnez un jeu" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="aviator">Aviator</SelectItem>
                                    <SelectItem value="luckyjet">Lucky Jet</SelectItem>
                                    <SelectItem value="paris-sportifs">Paris Sportifs</SelectItem>
                                    <SelectItem value="autre">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                            {formData.favoriteGame === 'autre' && (
                                <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="relative overflow-hidden">
                                     <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                                     <Input 
                                        id="otherFavoriteGame"
                                        value={formData.otherFavoriteGame}
                                        onChange={handleChange}
                                        placeholder="Nom du jeu..." 
                                        className="pl-10 bg-background/50"
                                     />
                                </motion.div>
                            )}
                        </div>
                    </FormRow>
                </div>
                
                <div className="flex flex-col gap-4 p-6 bg-muted/20 border-t border-border/50">
                  <Button size="lg" className="w-full" type="submit" disabled={isSaving || usernameStatus !== 'valid'}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Enregistrer les modifications'}
                  </Button>
                   <Button asChild variant="ghost" className="w-full">
                    <Link href="/profile">
                        Annuler
                    </Link>
                    </Button>
                </div>
            </form>
        </motion.div>
      </main>
    </div>
  );
}
