
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { doc, onSnapshot, getDoc, collection, query, where, getDocs, Timestamp, updateDoc, orderBy, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { PlanId, PricingConfig, PromoCode } from "@/types";
import { Button } from "@/components/ui/button";
import { Star, Crown, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { User } from "firebase/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type Plan = {
    id: PlanId;
    name: string;
    price: number;
    promoPrice: number | null;
    currency: string;
    period: string;
    features: string[];
    missingFeatures: string[];
    cta: string;
    popular?: boolean;
};

const paymentMethods = [
    { name: "Wave", logoUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/62/f6/ac/62f6ac8b-27d7-8a8f-e2c1-9bbc31e22fb1/AppIcon-0-0-1x_U007emarketing-0-1-0-85-220.png/230x0w.webp" },
    { name: "Orange Money", logoUrl: "https://www.orange.ci/particuliers/resources/img/master-logo.svg" },
    { name: "MTN Mobile Money", logoUrl: "https://www.mtn.ci/wp-content/themes/mtn-vivid-wp/public/img/mtn-logo-footer.svg" },
    { name: "Moov Money", logoUrl: "https://www.moov-africa.ci/wp-content/uploads/2020/12/moovafrica-1.png" }
];

const FeatureItem = ({ text, included, delay }: { text: string; included: boolean; delay: number }) => (
    <motion.li
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
        viewport={{ once: true }}
    >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
            {included ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/30" />
            )}
        </div>
        <span className={cn(included ? "text-foreground" : "text-muted-foreground/50 line-through")}>
            {text}
        </span>
    </motion.li>
);

export function PricingSection({ isLandingPage = false, user }: { isLandingPage?: boolean, user?: User | null }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [dialogStep, setDialogStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Promo Code State
    const [hasPromoCode, setHasPromoCode] = useState("non");
    const [promoCodeInput, setPromoCodeInput] = useState("");
    const [promoCodeStatus, setPromoCodeStatus] = useState<"idle" | "checking" | "valid" | "invalid" | "expired" | "limit_reached">("idle");
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [finalPrice, setFinalPrice] = useState<number | null>(null);

    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
        setIsLoading(true);
        const plansColRef = collection(db, "applications", "VMrS6ltRDuKImzxAl3lR", "plans");
        const q = query(plansColRef, orderBy("price", "asc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPlans = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: data.period,
                    name: data.name,
                    price: data.price,
                    promoPrice: data.promoPrice,
                    currency: data.currency,
                    period: data.period,
                    features: data.features || [],
                    missingFeatures: data.missingFeatures || [],
                    cta: "Activer le forfait",
                    popular: data.popular || false,
                } as Plan;
            }).filter(p => p.id !== 'annual');
            setPlans(fetchedPlans);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching plans:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleChoosePlan = (plan: Plan) => {
        const currentPrice = plan.promoPrice !== null && plan.promoPrice < plan.price ? plan.promoPrice : plan.price;
        setSelectedPlan(plan);
        setFinalPrice(currentPrice);
        setDialogStep(1);
        setIsPaymentDialogOpen(true);
    };

    const activateFreePlan = async () => {
        if (!user || !selectedPlan || !appliedPromo) return;
        
        setIsProcessing(true);
        try {
            const pricingDocRef = doc(db, "users", user.uid, "pricing", "jetpredict");
            const startDate = new Date();
            const endDate = new Date(startDate);

            switch (selectedPlan.id) {
                case 'hourly': endDate.setHours(startDate.getHours() + 1); break;
                case 'daily': endDate.setDate(startDate.getDate() + 1); break;
                case 'weekly': endDate.setDate(startDate.getDate() + 7); break;
                case 'monthly': endDate.setMonth(startDate.getMonth() + 1); break;
            }

            await updateDoc(pricingDocRef, {
                idplan_jetpredict: selectedPlan.id,
                actif_jetpredict: true,
                startdate: startDate,
                findate: endDate,
            });

            const promoDocRef = doc(db, "promo", appliedPromo.id);
            await updateDoc(promoDocRef, {
                people: arrayUnion(user.uid)
            });
            
            toast({
                variant: 'success',
                title: "Forfait activé !",
                description: `Votre forfait ${selectedPlan.name} est maintenant actif.`,
            });

            setIsPaymentDialogOpen(false);
            router.push('/predict');

        } catch (error) {
            console.error("Erreur lors de l'activation du forfait :", error);
            toast({
                variant: 'destructive',
                title: "Erreur d'activation",
                description: "Une erreur est survenue. Contactez le support."
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyPromoCode = async () => {
        if (!promoCodeInput.trim() || !selectedPlan || !user) return;
        setPromoCodeStatus("checking");

        const promoQuery = query(collection(db, "promo"), where("code", "==", promoCodeInput.trim()));
        const querySnapshot = await getDocs(promoQuery);

        if (querySnapshot.empty) {
            setPromoCodeStatus("invalid");
            return;
        }

        const promoDoc = querySnapshot.docs[0];
        const promoData = { id: promoDoc.id, ...promoDoc.data() } as PromoCode;

        if (promoData.max > 0 && promoData.people && promoData.people.length >= promoData.max) {
            setPromoCodeStatus("limit_reached");
            return;
        }

        const now = new Date();
        const startDate = (promoData.debutdate as Timestamp).toDate();
        const endDate = (promoData.findate as Timestamp).toDate();

        if (now < startDate || now > endDate) {
            setPromoCodeStatus("expired");
            return;
        }

        if (promoData.tous || promoData.plan === selectedPlan.id) {
            const currentPrice = selectedPlan.promoPrice ?? selectedPlan.price;
            const newPrice = currentPrice - (currentPrice * (promoData.pourcentage / 100));
            setFinalPrice(newPrice);
            setAppliedPromo(promoData);
            setPromoCodeStatus("valid");
        } else {
            setPromoCodeStatus("invalid");
        }
    };

    const handlePaymentMethodSelect = async (paymentMethodName: string) => {
        if (!selectedPlan || !user || finalPrice === null) return;
        
        setIsProcessing(true);

        try {
            if (appliedPromo) {
                const promoDocRef = doc(db, "promo", appliedPromo.id);
                await updateDoc(promoDocRef, {
                    people: arrayUnion(user.uid)
                });
            }

            let referralCode = null;
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                referralCode = userDoc.data().referralCode;
            }

            const basePrice = selectedPlan.price;
            const displayPrice = selectedPlan.promoPrice !== null && selectedPlan.promoPrice < basePrice ? selectedPlan.promoPrice : basePrice;

            let message = `*Activation de Forfait JetPredict*

Bonjour,

Je souhaite souscrire au forfait suivant :

*Forfait* : ${selectedPlan.name}
*ID* : ${selectedPlan.id}
*Prix initial* : ${displayPrice.toLocaleString('fr-FR')} ${selectedPlan.currency}`;

            if (appliedPromo) {
                message += `
*Code Promo* : ${appliedPromo.code} (${appliedPromo.pourcentage}% de réduction)
*Prix Final* : ${finalPrice.toLocaleString('fr-FR')} ${selectedPlan.currency}`;
            } else {
                message += `
*Prix Final* : ${finalPrice.toLocaleString('fr-FR')} ${selectedPlan.currency}`;
            }

            message += `

---

*Informations Client*
*Email* : ${user.email}
*UID* : ${user.uid}
`;
            
            if (referralCode) {
                message += `*Code de Parrainage Utilisé* : ${referralCode}\n`;
            }

            message += `
---

*Paiement*
*Moyen de paiement choisi* : ${paymentMethodName}

Merci de m'indiquer la procédure à suivre.`;

            const whatsappUrl = `https://wa.me/2250546511723?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            setIsPaymentDialogOpen(false);
        } catch (error) {
            console.error("Error during payment preparation:", error);
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de préparer le paiement. Veuillez réessayer." });
        } finally {
            setIsProcessing(false);
        }
    };
    
     useEffect(() => {
        if (!isPaymentDialogOpen) {
            setTimeout(() => {
                 setDialogStep(1);
                 setHasPromoCode("non");
                 setPromoCodeInput("");
                 setPromoCodeStatus("idle");
                 setAppliedPromo(null);
                 setFinalPrice(null);
            }, 300)
        }
    }, [isPaymentDialogOpen]);

    const renderPrice = (plan: Plan) => {
        const isPromo = plan.promoPrice !== null && plan.promoPrice < plan.price;
        const displayPrice = isPromo ? plan.promoPrice : plan.price;

        return (
            <div className="pt-2 flex flex-col items-center">
                {isPromo && (
                    <span className="text-xl font-normal text-muted-foreground/70 line-through">
                        {plan.price.toLocaleString('fr-FR')} {plan.currency}
                    </span>
                )}
                <span className="text-5xl font-extrabold text-foreground tracking-tighter">
                    {displayPrice.toLocaleString('fr-FR')} 
                    <span className="text-3xl font-bold text-muted-foreground/80">{plan.currency}</span>
                </span>
            </div>
        );
    };

    const renderPlanButton = (plan: Plan) => {
      if (isLandingPage) {
        return (
          <Button asChild size="lg" className="w-full font-semibold text-lg py-6 rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:shadow-primary/50 hover:scale-105">
            <Link href="/login">{plan.cta}</Link>
          </Button>
        );
      }
      return (
        <Button 
          size="lg" 
          className="w-full font-semibold text-lg py-6 rounded-xl bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 ease-in-out hover:bg-primary hover:shadow-primary/50 hover:scale-105"
          onClick={() => handleChoosePlan(plan)}
        >
          {plan.cta}
        </Button>
      );
    };
    
    const renderPromoStatus = () => {
        switch (promoCodeStatus) {
            case "checking":
                return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" /> Vérification...</p>;
            case "valid":
                return <p className="text-sm text-green-500 flex items-center gap-2"><CheckCircle /> Code appliqué !</p>;
            case "invalid":
                return <p className="text-sm text-destructive flex items-center gap-2"><XCircle /> Code invalide pour ce forfait.</p>;
            case "expired":
                return <p className="text-sm text-destructive flex items-center gap-2"><XCircle /> Code expiré.</p>;
            case "limit_reached":
                return <p className="text-sm text-destructive flex items-center gap-2"><XCircle /> Limite d'utilisation atteinte.</p>;
            default:
                return null;
        }
    };

    return (
        <>
            <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
            >
               <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">Nos Protocoles d'Accès</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Choisissez le protocole qui déverrouille votre potentiel.</p>
            </motion.div>
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        className="group relative"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                        viewport={{ once: true }}
                    >
                         <motion.div
                            className={cn(
                                "absolute -inset-px rounded-2xl bg-gradient-to-br transition-all duration-500 opacity-0 group-hover:opacity-100",
                                plan.popular ? "from-primary/70 via-blue-500/70 to-purple-500/70" : "from-border via-border/50 to-transparent"
                            )}
                            initial={{ filter: "blur(16px)"}}
                            whileHover={{ filter: "blur(24px)"}}
                        />
                        <div
                            className={cn(
                                "relative flex flex-col h-full bg-card/60 backdrop-blur-xl border rounded-2xl transition-all duration-300",
                                plan.popular ? "border-primary/30" : "border-border/20 group-hover:border-primary/20"
                            )}
                        >
                            <div className="flex flex-col h-full p-6 text-center">
                                {plan.popular && (
                                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-full border-2 border-background shadow-lg">
                                            <Star size={16} /> Le plus populaire
                                        </div>
                                    </div>
                                )}
                                <div className="pt-8">
                                    <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                                        {plan.id === 'monthly' && <Crown className="text-yellow-400" />} {plan.name}
                                    </h3>
                                    {renderPrice(plan)}
                                    <p className="text-sm text-muted-foreground mt-1">/ {plan.period.toLowerCase()}</p>
                                </div>
                                <ul className="space-y-4 text-left mt-8 flex-grow">
                                    {[...plan.features, ...plan.missingFeatures].map((feature, i) => (
                                        <FeatureItem
                                            key={i}
                                            text={feature}
                                            included={plan.features.includes(feature)}
                                            delay={0.3 + i * 0.05}
                                        />
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    {renderPlanButton(plan)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                </div>
            )}

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finaliser la commande</DialogTitle>
                         <DialogDescription>
                            Forfait : <span className="font-bold text-primary">{selectedPlan?.name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {dialogStep === 1 && (
                        <div className="py-4 space-y-4">
                            <Label>Avez-vous un code promotionnel ?</Label>
                             <RadioGroup value={hasPromoCode} onValueChange={setHasPromoCode} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="oui" id="promo-oui" />
                                    <Label htmlFor="promo-oui">Oui</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="non" id="promo-non" />
                                    <Label htmlFor="promo-non">Non</Label>
                                </div>
                            </RadioGroup>

                            {hasPromoCode === 'oui' && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Entrez votre code promo" 
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput(e.target.value)}
                                            disabled={promoCodeStatus === 'valid'}
                                        />
                                        <Button onClick={handleVerifyPromoCode} disabled={promoCodeStatus === 'checking' || promoCodeStatus === 'valid'}>
                                            {promoCodeStatus === 'checking' ? <Loader2 className="animate-spin"/> : 'Appliquer'}
                                        </Button>
                                    </div>
                                    <div className="h-5">
                                        {renderPromoStatus()}
                                    </div>
                                </div>
                            )}

                             <div className="border-t pt-4 mt-4 text-lg font-bold flex justify-between">
                                <span>Total à payer:</span>
                                <span>{finalPrice?.toLocaleString('fr-FR')} {selectedPlan?.currency}</span>
                            </div>
                            
                            <div className="pt-4">
                                {finalPrice === 0 ? (
                                    <Button onClick={activateFreePlan} className="w-full" disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmer et Activer
                                    </Button>
                                ) : (
                                    <Button onClick={() => setDialogStep(2)} className="w-full" disabled={hasPromoCode === 'oui' && promoCodeStatus === 'checking'}>
                                        Continuer vers le paiement
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {dialogStep === 2 && (
                         <div className="py-4">
                            <DialogDescription className="mb-4">
                                Choisissez votre méthode de paiement.
                            </DialogDescription>
                            <div className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.name}
                                        onClick={() => handlePaymentMethodSelect(method.name)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all"
                                        disabled={isProcessing}
                                    >
                                        <Image src={method.logoUrl} alt={method.name} width={64} height={64} className="h-10 object-contain"/>
                                        <span className="text-sm font-medium">{method.name}</span>
                                    </button>
                                ))}
                            </div>
                            <Button variant="link" onClick={() => setDialogStep(1)} className="mt-4" disabled={isProcessing}>Retour</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
