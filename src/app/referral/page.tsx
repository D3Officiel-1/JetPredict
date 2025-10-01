

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
  CardFooter,
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

const paymentMethods = [
    { name: "Wave", logoUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/62/f6/ac/62f6ac8b-27d7-8a8f-e2c1-9bbc31e22fb1/AppIcon-0-0-1x_U007emarketing-0-1-0-85-220.png/230x0w.webp" },
    { name: "Orange Money", logoUrl: "https://www.orange.ci/particuliers/resources/img/master-logo.svg" },
    { name: "MTN Mobile Money", logoUrl: "https://www.mtn.ci/wp-content/themes/mtn-vivid-wp/public/img/mtn-logo-footer.svg" },
    { name: "Moov Money", logoUrl: "https://www.moov-africa.ci/wp-content/uploads/2020/12/moovafrica-1.png" }
];

export default function ReferralPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ username: string, phone: string } | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<Commission[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [withdrawalPhoneNumber, setWithdrawalPhoneNumber] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalError, setWithdrawalError] = useState<string>('');

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
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data() as { username: string, solde_referral?: number, phone?: string };
          setUserData({ username: data.username, phone: data.phone || '' });
          setBalance(data.solde_referral || 0);
          setWithdrawalPhoneNumber(data.phone || '');
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

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setIsCopied(true);
      toast({
        variant: 'success',
        title: 'Copié !',
        description: 'Code de parrainage copié.',
      });
      setTimeout(() => setIsCopied(false), 3000);
    });
  };
  
  const handleShareCode = () => {
     if (!referralCode) return;
     handleCopyCode();
  }

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
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background text-foreground overflow-hidden p-4 sm:p-8">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#313b5c44,transparent)]"></div>
      
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost">
          <Link href="/predict">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
      
      <main className="w-full max-w-4xl z-10 mt-20 space-y-8">
        <Card className="bg-card/70 backdrop-blur-sm border-border/50 overflow-hidden">
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
                     <div className="relative flex justify-center items-center">
                        <div className="absolute h-24 w-24 bg-primary/10 rounded-full blur-xl"></div>
                        <div className="relative bg-primary/10 text-primary rounded-full h-24 w-24 flex items-center justify-center border-2 border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                            <Gift className="w-12 h-12" />
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full border-2 border-background">
                                20%
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-sm text-muted-foreground">Solde de parrainage</p>
                        <p className="text-5xl font-bold text-primary">
                            {balance.toLocaleString('fr-FR')} <span className="text-3xl text-muted-foreground">FCFA</span>
                        </p>
                    </div>
                </div>

                <div className="text-center bg-muted/50 p-4 rounded-lg border border-border/50">
                    <p className="text-muted-foreground text-sm">
                        Partagez votre code. Pour chaque forfait acheté par vos filleuls, vous recevez 20% de commission.
                    </p>
                </div>
                
                <div>
                    <Label className="text-sm text-muted-foreground text-center block mb-2">Votre Code de Parrainage</Label>
                    <div className="relative flex items-stretch gap-2">
                        <div className="flex-1 text-center text-2xl font-bold tracking-widest bg-muted text-primary rounded-lg px-6 py-3 border border-dashed border-primary/50 flex items-center justify-center">
                            {referralCode || <Loader2 className="w-5 h-5 animate-spin mx-auto"/>}
                        </div>
                        <Button onClick={handleCopyCode} variant="outline" className="px-4 h-auto" disabled={!referralCode}>
                            {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                <div>
                    <Button onClick={openWithdrawDialog} disabled={balance < 1000} className="w-full h-12 text-lg">
                        <Download className="mr-2 h-5 w-5" />
                        Retirer mes gains
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="text-primary"/>
                Mes Filleuls ({referredUsers.length})
            </CardTitle>
            <CardDescription>
              Voici la liste des utilisateurs qui se sont inscrits avec votre code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Date d'inscription</TableHead>
                            <TableHead className="text-right">Commissions générées</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {referredUsers.map((refUser) => (
                            <TableRow key={refUser.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={refUser.photoURL} />
                                        <AvatarFallback>{refUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{refUser.username}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono">{refUser.joinDate}</TableCell>
                            <TableCell className="text-right font-bold text-green-400">
                                {refUser.totalCommissions > 0 ? `+${refUser.totalCommissions.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                  </Table>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-6 bg-muted/30 rounded-lg">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-16 w-16 bg-primary/10 rounded-full animate-pulse"></div>
                        <Users className="w-16 h-16 text-primary/70"/>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Invitez vos amis et gagnez ensemble !</h3>
                        <p className="text-sm max-w-xs mx-auto">Partagez votre code de parrainage pour commencer à construire votre réseau.</p>
                    </div>
                     <Button onClick={handleShareCode} variant="outline" disabled={!referralCode}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Partager mon code
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>

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


    

    

    

    