

'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Copy, Check, Gift, Users, Download, AlertCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Header from '@/components/ui/sidebar';
import { motion, AnimatePresence } from "framer-motion";

interface ReferralUser {
    id: string;
    username: string;
    photoURL?: string;
    joinDate: string;
    totalCommissions: number;
}

interface Commission {
    id: string;
    amount: number;
    fromUser: string;
    plan: string;
    date: string;
}

const loadingTexts = [
    "ANALYSE DU PROFIL...",
    "VÉRIFICATION DES ACCÈS...",
    "SYNCHRONISATION AU NOYAU...",
    "PROTOCOLES CHARGÉS.",
];

const paymentMethods = [
    { name: "Wave", logoUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/62/f6/ac/62f6ac8b-27d7-8a8f-e2c1-9bbc31e22fb1/AppIcon-0-0-1x_U007emarketing-0-1-0-85-220.png/230x0w.webp" },
    { name: "Orange Money", logoUrl: "https://www.orange.ci/particuliers/resources/img/master-logo.svg" },
    { name: "MTN Mobile Money", logoUrl: "https://www.mtn.ci/wp-content/themes/mtn-vivid-wp/public/img/mtn-logo-footer.svg" },
    { name: "Moov Money", logoUrl: "https://www.moov-africa.ci/wp-content/uploads/2020/12/moovafrica-1.png" }
];

export default function ReferralPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ username: string } | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<Commission[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalError, setWithdrawalError] = useState<string>('');
  const [withdrawalPhoneNumber, setWithdrawalPhoneNumber] = useState('');

  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    if (isLoading) {
        const textInterval = setInterval(() => {
            setLoadingTextIndex(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
        }, 500);
        return () => clearInterval(textInterval);
    }
  }, [isLoading])

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
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data() as { username: string, solde_referral?: number };
          setUserData({ username: data.username });
          setBalance(data.solde_referral || 0);
        }
        setIsLoading(false);
      });

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, [auth, router]);

  useEffect(() => {
    if (!user || !userData) return;

    // Listener for commissions
    const commissionsColRef = collection(db, "users", user.uid, "referral");
    const q = query(commissionsColRef, orderBy('date', 'desc'));
    const unsubscribeCommissions = onSnapshot(q, (commissionSnapshot) => {
      const newCommissionHistory = commissionSnapshot.docs
        .filter(doc => doc.data().fromUser !== "Système") // Exclude initialization doc
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.amount,
            fromUser: data.fromUser,
            plan: data.plan,
            date: data.date.toDate().toLocaleDateString('fr-FR'),
          };
        });
      setCommissionHistory(newCommissionHistory);

      // Fetch referred users and calculate their commission totals
      const fetchReferredUsers = async () => {
        const referralsQuery = query(collection(db, "users"), where("referralCode", "==", userData.username));
        const referralsSnapshot = await getDocs(referralsQuery);
        const fetchedReferredUsers = referralsSnapshot.docs.map(doc => {
          const docData = doc.data();
          const username = docData.username || 'N/A';
          
          const totalCommissions = newCommissionHistory
            .filter(commission => commission.fromUser === username)
            .reduce((sum, commission) => sum + commission.amount, 0);
            
          return {
            id: doc.id,
            username: username,
            photoURL: docData.photoURL || '',
            joinDate: docData.createdAt?.toDate().toLocaleDateString('fr-FR') || 'N/A',
            totalCommissions: totalCommissions,
          };
        });
        setReferredUsers(fetchedReferredUsers);
      };
      
      fetchReferredUsers();
    });
    
    return () => unsubscribeCommissions();

  }, [user, userData]);

  const referralCode = userData?.username;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      try {
        const audio = new Audio('https://cdn.pixabay.com/download/audio/2025/09/02/audio_4e70a465f7.mp3?filename=new-notification-3-398649.mp3');
        audio.volume = 0.2;
        audio.play();
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
      } catch (e) {
          console.error("Failed to play sound or vibrate:", e)
      }
      setIsCopied(true);
      toast({
        variant: 'success',
        title: 'Copié !',
        description: 'Code de parrainage copié.',
        disableSound: true,
      });
      setTimeout(() => setIsCopied(false), 3000);
    });
  };
  
  const handleShareLink = async () => {
     if (!referralCode) return;
     const shareData = {
        title: 'Rejoignez Jet Predict !',
        text: `Inscrivez-vous sur Jet Predict avec mon code de parrainage et commencez à gagner !`,
        url: referralLink,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        navigator.clipboard.writeText(referralLink).then(() => {
             toast({
                variant: 'success',
                title: 'Lien Copié !',
                description: 'Le lien de parrainage a été copié dans votre presse-papiers.',
            });
        });
    }
  };

  const openWithdrawDialog = () => {
    if (balance < 1000) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: 'Minimum pour retrait : 1000 FCFA.',
      });
      return;
    }
    setWithdrawalError('');
    setWithdrawalAmount(String(balance));
    setIsWithdrawDialogOpen(true);
  };
  
  useEffect(() => {
    if (!isWithdrawDialogOpen) return;

    const amount = Number(withdrawalAmount);
    if (isNaN(amount)) {
      setWithdrawalError("Le montant doit être un nombre.");
    } else if (amount < 1000) {
      setWithdrawalError("Montant minimum de retrait : 1000 FCFA.");
    } else if (amount > balance) {
      setWithdrawalError("Le montant ne peut pas dépasser votre solde.");
    } else {
      setWithdrawalError('');
    }
  }, [withdrawalAmount, balance, isWithdrawDialogOpen]);

  const handleConfirmWithdrawal = () => {
    if (withdrawalError) {
       toast({
            variant: 'destructive',
            title: 'Erreur de saisie',
            description: withdrawalError,
        });
        return;
    }
    
    if (!selectedPaymentMethod || !withdrawalPhoneNumber) {
        toast({
            variant: 'destructive',
            title: 'Champs requis',
            description: 'Veuillez sélectionner un moyen de paiement et un numéro.',
        });
        return;
    }

    if (!user) return;
    const message = `*Demande de Retrait de Commissions*

Bonjour,

Je souhaite retirer mes commissions de parrainage.

*Montant du retrait* : ${Number(withdrawalAmount).toLocaleString('fr-FR')} FCFA
*Solde restant après retrait* : ${(balance - Number(withdrawalAmount)).toLocaleString('fr-FR')} FCFA

---
*Moyen de paiement* : ${selectedPaymentMethod}
*Numéro de dépôt* : ${withdrawalPhoneNumber}
---

*Informations Client*
*Email* : ${user.email}
*UID* : ${user.uid}
*Pseudo* : ${userData?.username}

---

Merci de traiter ma demande.`;

    const whatsappUrl = `https://wa.me/2250546511723?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsWithdrawDialogOpen(false);
  };
  
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
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="relative bg-card/70 backdrop-blur-sm border-border/50 overflow-hidden shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] -z-10"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>

              <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center text-center md:text-left">
                      <div>
                          <p className="text-sm text-muted-foreground">Solde de parrainage</p>
                          <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300 drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                              {balance.toLocaleString('fr-FR')} <span className="text-3xl text-muted-foreground">FCFA</span>
                          </p>
                      </div>
                      <div className="relative flex justify-center items-center h-24 w-24 mx-auto md:mx-0">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative bg-primary/10 text-primary rounded-full h-24 w-24 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                              <Gift className="w-12 h-12" />
                              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full border-2 border-background">
                                  20%
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="text-center bg-muted/30 p-4 rounded-lg border border-border/30">
                      <p className="text-muted-foreground text-sm">
                          Partagez votre code. Pour chaque forfait acheté par vos filleuls, vous recevez 20% de commission.
                      </p>
                  </div>
                  
                  <div className="space-y-4">
                      <Label className="text-sm text-muted-foreground text-center block">Votre Code de Parrainage</Label>
                      <div className="relative flex items-stretch gap-2 group">
                          <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-cyan-500/50 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                          <div className="relative flex-1 text-center text-2xl font-bold tracking-widest bg-muted text-primary rounded-lg px-6 py-3 border border-dashed border-primary/50 flex items-center justify-center">
                              {referralCode || <Loader2 className="w-5 h-5 animate-spin mx-auto"/>}
                          </div>
                           <Button onClick={handleCopyCode} variant="outline" className="relative px-4 h-auto bg-muted/80" disabled={!referralCode} disableSound={true}>
                              {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                          </Button>
                           <Button onClick={handleShareLink} variant="outline" className="relative px-4 h-auto bg-muted/80" disabled={!referralCode}>
                              <Share2 className="h-5 w-5" />
                          </Button>
                      </div>
                  </div>

                  <div className="pt-2">
                      <Button onClick={openWithdrawDialog} disabled={balance < 1000} className="w-full h-12 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                          <Download className="mr-2 h-5 w-5" />
                          Retirer mes gains
                      </Button>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="bg-card/70 backdrop-blur-sm border-border/50">
              <CardHeader>
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
                          <Users className="h-6 w-6" />
                      </div>
                      <div>
                          <CardTitle>Réseau de Filleuls ({referredUsers.length})</CardTitle>
                          <CardDescription>
                              Votre équipe d'affiliés et les commissions générées.
                          </CardDescription>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  {referredUsers.length > 0 ? (
                      <div className="flow-root">
                          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                  <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50 rounded-t-lg">
                                          <div>Utilisateur</div>
                                          <div className="text-center">Date d'inscription</div>
                                          <div className="text-right">Commissions</div>
                                      </div>
                                      {referredUsers.map((refUser) => (
                                          <div key={refUser.id} className="grid grid-cols-3 gap-4 items-center px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors">
                                              <div className="flex items-center gap-3 truncate">
                                                  <Avatar className="h-9 w-9">
                                                      <AvatarImage src={refUser.photoURL} />
                                                      <AvatarFallback>{refUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                  <span className="font-medium truncate">{refUser.username}</span>
                                              </div>
                                              <div className="font-mono text-center text-sm text-muted-foreground">{refUser.joinDate}</div>
                                              <div className="text-right font-bold text-green-400">
                                                  {refUser.totalCommissions > 0 ? `+${refUser.totalCommissions.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-6 bg-muted/30 rounded-lg">
                          <div className="relative flex items-center justify-center">
                              <div className="absolute h-16 w-16 bg-primary/10 rounded-full animate-pulse"></div>
                              <Users className="w-16 h-16 text-primary/70"/>
                          </div>
                          <div className="space-y-1">
                              <h3 className="text-lg font-semibold text-foreground">Construisez votre réseau</h3>
                              <p className="text-sm max-w-xs mx-auto">Partagez votre code pour recruter des filleuls et commencer à gagner des commissions.</p>
                          </div>
                          <Button onClick={handleShareLink} variant="outline" disabled={!referralCode}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Partager mon lien
                          </Button>
                      </div>
                  )}
              </CardContent>
          </Card>
        </div>


        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Demande de Retrait</DialogTitle>
                    <DialogDescription>
                        Indiquez le montant, choisissez le moyen de paiement et confirmez votre numéro.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="withdrawal-amount">Montant à retirer (FCFA)</Label>
                        <div className="relative">
                          <Input
                              id="withdrawal-amount"
                              type="number"
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              placeholder="Ex: 5000"
                              min="1000"
                              max={balance}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              / {balance.toLocaleString('fr-FR')}
                          </div>
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="payment-method">Moyen de paiement</Label>
                         <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                            <SelectTrigger id="payment-method">
                                <SelectValue placeholder="Sélectionnez un moyen" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.name} value={method.name}>
                                        <div className="flex items-center gap-2">
                                            <Image src={method.logoUrl} alt={method.name} width={24} height={24} className="object-contain h-6 w-6"/>
                                            <span>{method.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="withdrawal-phone">Numéro de téléphone pour le dépôt</Label>
                        <Input 
                            id="withdrawal-phone" 
                            value={withdrawalPhoneNumber}
                            onChange={(e) => setWithdrawalPhoneNumber(e.target.value)}
                            placeholder="Votre numéro de téléphone"
                        />
                    </div>
                    {withdrawalError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {withdrawalError}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleConfirmWithdrawal} disabled={!!withdrawalError}>Confirmer le retrait</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
