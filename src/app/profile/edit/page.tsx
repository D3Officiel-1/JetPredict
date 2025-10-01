

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
import { ArrowLeft, Loader2, CheckCircle, XCircle, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  favoriteGame: string;
}

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    favoriteGame: '',
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
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            phone: data.phone || '',
            favoriteGame: data.favoriteGame || '',
          });
          setInitialUsername(data.username || '');
          setUsernameStatus('valid');
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
  
  const handleSelectChange = (value: string) => {
      setFormData(p => ({...p, favoriteGame: value}));
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

        // Si le nom d'utilisateur a changé, mettez à jour les codes de parrainage des filleuls
        const usernameChanged = formData.username !== initialUsername;
        if (usernameChanged && initialUsername) {
            const referralsQuery = query(collection(db, "users"), where("referralCode", "==", initialUsername));
            const referralsSnapshot = await getDocs(referralsQuery);
            referralsSnapshot.forEach((referralDoc) => {
                const referralRef = doc(db, "users", referralDoc.id);
                batch.update(referralRef, { referralCode: formData.username });
            });
        }
        
        // Mettre à jour le profil de l'utilisateur
        batch.update(userDocRef, { ...formData });

        // Valider toutes les écritures
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
    switch (usernameStatus) {
        case 'checking':
            return <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification...</p>;
        case 'valid':
            return <p className="text-sm text-green-500 flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Pseudo disponible !</p>;
        case 'invalid':
            return <p className="text-sm text-destructive flex items-center"><XCircle className="mr-2 h-4 w-4" /> Les emojis et espaces sont interdits.</p>;
        case 'taken':
            return <p className="text-sm text-destructive flex items-center"><XCircle className="mr-2 h-4 w-4" /> Ce pseudo est déjà pris.</p>;
        default:
            return <p className="text-sm text-muted-foreground">Doit être unique et sans espaces/emojis.</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center text-center p-4">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" />
        <p className="mt-4 text-muted-foreground">Chargement des informations...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#313b5c44,transparent)]"></div>
      
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost">
          <Link href="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
          </Link>
        </Button>
      </div>

      <main className="w-full max-w-lg z-10 mt-20">
        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl"><UserIcon />Modifier le Profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles ici.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" value={formData.username} onChange={handleChange} />
                <div className="h-5 mt-1">{renderUsernameFeedback()}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input id="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favoriteGame">Jeu Préféré</Label>
                <Select value={formData.favoriteGame} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un jeu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="aviator">Aviator</SelectItem>
                        <SelectItem value="luckyjet">Lucky Jet</SelectItem>
                        <SelectItem value="paris-sportifs">Paris Sportifs</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isSaving || usernameStatus !== 'valid'}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enregistrer les modifications'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}