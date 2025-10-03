

"use client";

import { useState, useEffect, useTransition, useMemo, Fragment, useRef, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { Timestamp, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  predictCrashPoint,
  PredictCrashPointInput,
  PredictCrashPointOutput,
} from "@/ai/flows/predict-crash-point";
import {
  suggestBettingStrategy,
  SuggestBettingStrategyInput,
  SuggestBettingStrategyOutput,
} from "@/ai/flows/suggest-betting-strategy";
import { saveStrategiesToPrediction } from "@/ai/flows/save-strategies";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Loader2,
  Target,
  Copy,
  Check,
  Zap,
  Shield,
  Clock,
  Info,
  PictureInPicture,
  X,
  Lock,
  Flame,
  Bomb,
  TrendingUp,
  LineChart as LineChartIcon
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "./ui/dialog";
import type { PlanId } from '@/types';
import { TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip";


const INITIAL_HISTORY: number[] = [];

const RISK_LEVELS = [
    { id: "Faible", name: "Faible", icon: <Shield className="w-6 h-6" />, description: "Cotes basses, intervalles courts. Idéal pour des gains réguliers et sécurisés." },
    { id: "Modéré", name: "Modéré", icon: <TrendingUp className="w-6 h-6" />, description: "Bon équilibre entre risque et récompense. Pour les joueurs patients." },
    { id: "Élevé", name: "Élevé", icon: <Flame className="w-6 h-6" />, description: "Cotes élevées, gains potentiels importants, mais plus risqué." },
    { id: "Très élevé", name: "Très élevé", icon: <Bomb className="w-6 h-6" />, description: "Pour les chasseurs de jackpots. Cotes massives, risque maximal." },
];

const PLAN_RISK_LEVELS: Record<PlanId, string[]> = {
    hourly: ["Faible"],
    daily: ["Faible", "Modéré"],
    weekly: ["Faible", "Modéré", "Élevé"],
    monthly: ["Faible", "Modéré", "Élevé", "Très élevé"],
};


type SinglePrediction = {
  time: string;
  predictedCrashPoint: number;
};

type SelectedPrediction = {
  prediction: SinglePrediction;
  index: number;
} | null;

interface NotificationSettings {
    alertsEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
}

let pipWindow: Window | null = null;


export function CrashPredictorDashboard({ planId, notificationSettings }: { planId: PlanId, notificationSettings?: NotificationSettings }) {
  const [isClient, setIsClient] = useState(false);
  const [gameHistory, setGameHistory] = useState<number[]>(INITIAL_HISTORY);
  const [historyInput, setHistoryInput] = useState("");
  const [riskLevel, setRiskLevel] = useState("Modéré");
  
  const [prediction, setPrediction] =
    useState<PredictCrashPointOutput | null>(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<SelectedPrediction>(null);
  const [strategies, setStrategies] = useState<SuggestBettingStrategyOutput | null>(null);
  const [isFetchingStrategies, startFetchingStrategies] = useTransition();

  const [isPredicting, startPredictionTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ pronostiqueurCode?: string } | null>(null);
  const auth = getAuth(app);

  const [isFullScreenPredictionOpen, setIsFullScreenPredictionOpen] = useState(false);
  const [fullScreenPredictionData, setFullScreenPredictionData] = useState<SinglePrediction | null>(null);
  const [isOverlayGuideOpen, setIsOverlayGuideOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'conservative' | 'aggressive'>('conservative');
  
  const notifiedPredictions = useRef(new Set());


  const allowedRiskLevels = useMemo(() => PLAN_RISK_LEVELS[planId] || [], [planId]);
  const canAccessPremiumFeatures = useMemo(() => planId === 'weekly' || planId === 'monthly', [planId]);
  const canAccessChart = useMemo(() => planId === 'daily' || planId === 'weekly' || planId === 'monthly', [planId]);
  const canCopy = useMemo(() => planId === 'daily' || planId === 'weekly' || planId === 'monthly', [planId]);

  useEffect(() => {
    if (!allowedRiskLevels.includes(riskLevel)) {
      setRiskLevel(allowedRiskLevels[0] || 'Faible');
    }
  }, [allowedRiskLevels, riskLevel]);


  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) return;
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            setUserData(userDoc.data() as { pronostiqueurCode?: string });
        }
    });

    const handleCheckPredictions = () => {
        if (!prediction || !prediction.predictions || notificationSettings?.alertsEnabled === false) return;

        prediction.predictions.forEach((p) => {
            const [hours, minutes] = p.time.split(':').map(Number);
            const predictionDate = new Date(currentTime);
            predictionDate.setHours(hours, minutes, 0, 0);

            const diffInSeconds = (predictionDate.getTime() - currentTime.getTime()) / 1000;

            if (diffInSeconds > 29.5 && diffInSeconds < 30.5 && !notifiedPredictions.current.has(p.time)) {
                toast({
                    title: "🚀 Alerte Prédiction imminente !",
                    description: `La cote de ${p.predictedCrashPoint.toFixed(2)}x arrive dans 30 secondes (${p.time}).`,
                    variant: "success",
                });
                
                if (notificationSettings?.soundEnabled !== false) {
                    const audio = new Audio('https://cdn.pixabay.com/download/audio/2025/07/04/audio_a32bdcf6c0.mp3?filename=new-notification-024-370048.mp3');
                    audio.play().catch(e => console.error("Erreur de lecture audio:", e));
                }

                if (notificationSettings?.vibrationEnabled !== false && 'vibrate' in navigator) {
                    navigator.vibrate(200);
                }

                notifiedPredictions.current.add(p.time);
            }
        });
    };

    window.addEventListener('checkPredictions', handleCheckPredictions);

    return () => {
      clearInterval(timer);
      unsubscribeAuth();
      window.removeEventListener('checkPredictions', handleCheckPredictions);
    };
  }, [auth, prediction, currentTime, toast, notificationSettings]);


  useEffect(() => {
    const fetchLatestPrediction = async () => {
        if (!user || !riskLevel) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const predictionsRef = collection(db, "predictions");
        const q = query(
            predictionsRef,
            where("userId", "==", user.uid),
            where("inputData.riskLevel", "==", riskLevel),
            where("createdAt", ">=", Timestamp.fromDate(today)),
            where("createdAt", "<", Timestamp.fromDate(tomorrow)),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const latestPredictionDoc = querySnapshot.docs[0];
                const data = latestPredictionDoc.data();
                setPrediction({
                    predictions: data.predictions,
                    predictionId: latestPredictionDoc.id,
                    savedStrategies: data.savedStrategies || [],
                });
            } else {
                setPrediction(null);
            }
        } catch (error) {
            console.error("Error fetching latest prediction:", error);
            setPrediction(null);
        }
    };

    if(isClient) {
        fetchLatestPrediction();
    }
}, [user, riskLevel, isClient, toast]);

    useEffect(() => {
        if (!prediction || !('mediaSession' in navigator)) {
            return;
        }

        const updateMediaSession = () => {
            const now = new Date();
            const upcomingPredictions = prediction.predictions?.filter(p => {
                const [h, m] = p.time.split(':').map(Number);
                const pTime = new Date();
                pTime.setHours(h, m, 0, 0);
                return pTime.getTime() > now.getTime();
            });

            if (upcomingPredictions && upcomingPredictions.length > 0) {
                const nextPrediction = upcomingPredictions[0];
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `Prochain Crash: ${nextPrediction.predictedCrashPoint.toFixed(2)}x`,
                    artist: `À ${nextPrediction.time}`,
                    album: 'JetPredict',
                     artwork: [{
                        src: 'https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }]
                });
            } else {
                 navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'Aucune prédiction à venir',
                    artist: 'JetPredict',
                    album: 'JetPredict',
                     artwork: [{
                        src: 'https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }]
                });
            }
        };

        const intervalId = setInterval(updateMediaSession, 1000);
        updateMediaSession(); // Initial call

        return () => clearInterval(intervalId);
    }, [prediction]);

  const hasFuturePredictions = useMemo(() => {
    if (!prediction || !prediction.predictions || prediction.predictions.length === 0) {
      return false;
    }
    const now = new Date();
    const lastPredictionTime = prediction.predictions[prediction.predictions.length - 1].time;
    const [hours, minutes] = lastPredictionTime.split(':').map(Number);
    const lastPredictionDate = new Date(now);
    lastPredictionDate.setHours(hours, minutes, 0, 0);

    return now < lastPredictionDate;
  }, [prediction, currentTime]);

  const handlePrediction = () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Non authentifié",
            description: "Vous devez être connecté pour prédire.",
        });
        return;
    }
    const historyArray = historyInput.replace(/x/g, "").split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    if (historyArray.length === 0) {
      toast({
        variant: "destructive",
        title: "Données invalides",
        description: "Veuillez saisir un historique de crash valide.",
      });
      return;
    }
    setGameHistory(historyArray);
    runPrediction(historyArray, user.uid);
  };
  
  const runPrediction = (history: number[], userId: string) => {
    if (history.length === 0) {
        setPrediction(null);
        return;
    };
    
    setSelectedPrediction(null);
    setStrategies(null);

    startPredictionTransition(async () => {
      const now = new Date();
      const userTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const predictionInput: PredictCrashPointInput = {
        userId: userId,
        gameName: 'Crash Game',
        gameData: history,
        riskLevel: riskLevel,
        gameState: `Analyse manuelle, Tour: ${history.length + 1}`,
        userTime: userTime,
      };

      try {
        const predResult = await predictCrashPoint(predictionInput);
        setPrediction(predResult);
        notifiedPredictions.current.clear();

      } catch (error) {
        console.error("La prédiction a échoué:", error);
        toast({
          variant: "destructive",
          title: "Erreur de prédiction",
          description:
            "L'IA n'a pas réussi à générer une prédiction.",
        });
      }
    });
  };

  const handleCopyPredictions = () => {
    if (!prediction || !prediction.predictions) return;

    let textToCopy;
    const predictionsText = prediction.predictions
      .map(p => `${p.time} - ${p.predictedCrashPoint.toFixed(2)}x`)
      .join('\n');

    if (userData?.pronostiqueurCode) {
      const header = `PREDICTION ${riskLevel.toUpperCase()} ✈️.

RECHARGER 5.000 FCFA OU 10.000 FCFA POUR GANGER AU MINIMUM 100.000 FCFA OU 200.000 FCFA

PREDICTION ${riskLevel.toUpperCase()} 🔴🔵🟠💰

✅ 99% SURE DE RENTRER

CODE PROMO ${userData.pronostiqueurCode} 🎁\n\n`;

      const footer = `\n\nmiser gros vite vite 🤗🥰`;
      textToCopy = header + predictionsText + footer;
    } else {
      textToCopy = predictionsText;
    }
      
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        variant: 'success',
        title: "Copié !",
        description: "Les prédictions ont été copiées.",
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier les prédictions.",
      });
    });
  };

  const getPredictionTimeColor = (predictedTime: string) => {
    const [hours, minutes] = predictedTime.split(':').map(Number);
    const predictionDate = new Date(currentTime);
    predictionDate.setHours(hours, minutes, 0, 0);

    const diffInSeconds = (predictionDate.getTime() - currentTime.getTime()) / 1000;

    if (diffInSeconds > 0 && diffInSeconds <= 30) {
      return 'text-green-500';
    }
    
    if (diffInSeconds <= 0 && diffInSeconds > -60) {
      return 'text-orange-500';
    }

    return 'text-red-500';
  };

 const handlePictureInPicture = async () => {
    if (!canAccessPremiumFeatures) {
        toast({
            variant: "destructive",
            title: "Accès Premium Requis",
            description: "Passez au forfait Semaine ou Mois pour utiliser la superposition.",
        });
        router.push('/pricing');
        return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        setIsOverlayGuideOpen(true);
        return;
    }


    if (!('documentPictureInPicture' in window)) {
        toast({
            variant: "destructive",
            title: "Non supporté",
            description: "Votre navigateur ne supporte pas la superposition.",
        });
        return;
    }

    try {
        pipWindow = await (window as any).documentPictureInPicture.requestWindow({
            width: 300,
            height: 400,
        });

        const computedStyle = window.getComputedStyle(document.body);
        const styleVars = [
            '--background', '--foreground', '--card', '--card-foreground',
            '--popover', '--popover-foreground', '--primary', '--primary-foreground',
            '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
            '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
            '--border', '--input', '--ring'
        ].map(v => `${v}: ${computedStyle.getPropertyValue(v)}`).join('; ');

        const css = `
            :root { ${styleVars} }
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
            
            body { 
                margin: 0; 
                font-family: 'Space Grotesk', 'Arial', sans-serif; 
                background: radial-gradient(circle, hsl(var(--background) / 0.8), hsl(var(--background))), hsl(var(--background));
                color: hsl(var(--foreground)); 
                padding: 16px;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                height: 100vh;
                box-sizing: border-box;
            }
            * {
              box-sizing: border-box;
            }
            #content {
              flex-grow: 1;
              overflow-y: auto;
              scrollbar-width: none;
            }
            #content::-webkit-scrollbar { 
                display: none;
            }
            h2 { 
              font-size: 1.2em; 
              color: hsl(var(--primary)); 
              border-bottom: 1px solid hsl(var(--border)); 
              padding-bottom: 8px; 
              margin: 0 0 12px 0; 
              white-space: nowrap; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              font-weight: 700;
            }
            .prediction-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 4px; 
              font-size: 1em; 
              border-bottom: 1px solid hsl(var(--border) / 0.5);
              transition: background-color 0.2s ease;
            }
            .prediction-row:hover {
              background-color: hsl(var(--accent) / 0.5);
            }
            .prediction-row span:first-child { 
              font-family: monospace, 'Space Grotesk'; 
            }
            .prediction-row span:last-child { 
              font-weight: 700; 
              color: hsl(var(--primary));
            }
            .color-green { color: #22c55e; }
            .color-orange { color: #f97316; }
            .color-red { color: #ef4444; }
        `;
        const style = pipWindow.document.createElement('style');
        style.textContent = css;
        pipWindow.document.head.appendChild(style);

        const contentDiv = pipWindow.document.createElement('div');
        contentDiv.id = 'content';
        pipWindow.document.body.appendChild(contentDiv);

        const updatePipContent = () => {
            if (!pipWindow || pipWindow.closed) {
                clearInterval(intervalId);
                return;
            }
            const now = new Date();
            const upcomingPredictions = prediction?.predictions?.filter(p => {
                const [h, m] = p.time.split(':').map(Number);
                const pTime = new Date();
                pTime.setHours(h, m, 0, 0);
                return pTime.getTime() > now.getTime() - 60000;
            }).slice(0, 20);

            let content = `<h2>JetPredict - ${now.toLocaleTimeString('fr-FR')}</h2>`;
            if (upcomingPredictions && upcomingPredictions.length > 0) {
                content += upcomingPredictions.map(p => {
                     const colorMap: { [key: string]: string } = {
                        'text-green-500': 'color-green',
                        'text-orange-500': 'color-orange',
                        'text-red-500': 'color-red'
                    };
                    const colorClass = getPredictionTimeColor(p.time);
                    const colorClassName = colorMap[colorClass] || '';
                     return `<div class="prediction-row"><span class="${colorClassName}">${p.time}</span> <span>${p.predictedCrashPoint.toFixed(2)}x</span></div>`;
                }).join('');
            } else {
                content += '<p>Aucune prédiction à venir.</p>';
            }
            contentDiv.innerHTML = content;
        };

        const intervalId = setInterval(updatePipContent, 1000);
        pipWindow.addEventListener('pagehide', () => {
            clearInterval(intervalId);
            pipWindow = null;
        });

    } catch (error) {
        console.error("Erreur PiP:", error);
        toast({
            variant: "destructive",
            title: "Erreur de superposition",
            description: "Impossible d'ouvrir la fenêtre de superposition.",
        });
    }
  };


  const handlePredictionClick = (p: SinglePrediction) => {
    setFullScreenPredictionData(p);
    setStrategies(null);
    setIsFullScreenPredictionOpen(true);

    if (!canAccessPremiumFeatures) return;

    startFetchingStrategies(async () => {
      try {
        if (prediction?.savedStrategies) {
          const cachedStrategy = prediction.savedStrategies.find(s => s.time === p.time);
          if (cachedStrategy) {
              setStrategies({
                  conservativeStrategy: cachedStrategy.conservativeStrategy,
                  aggressiveStrategy: cachedStrategy.aggressiveStrategy,
              });
              return;
          }
        }
        
        const strategyInput: SuggestBettingStrategyInput = {
          riskTolerance: riskLevel,
          predictedCrashPoint: p.predictedCrashPoint,
        };
        const strategyResult = await suggestBettingStrategy(strategyInput);
        setStrategies(strategyResult);

        if (prediction?.predictionId && strategyResult) {
          await saveStrategiesToPrediction({
            predictionId: prediction.predictionId,
            strategies: strategyResult,
            predictionTime: p.time,
          });
          setPrediction(prev => {
              if (!prev) return null;
              const newSavedStrategies = [...(prev.savedStrategies || []), { time: p.time, ...strategyResult }];
              return { ...prev, savedStrategies: newSavedStrategies };
          })
        }
      } catch (error) {
        console.error("La suggestion de stratégie a échoué:", error);
        toast({
          variant: "destructive",
          title: "Erreur de Stratégie",
          description: "L'IA n'a pas pu générer de stratégie.",
        });
      }
    });
  };

  const handleRiskLevelChange = (level: string) => {
    if (allowedRiskLevels.includes(level)) {
        setRiskLevel(level);
    } else {
        toast({
            variant: 'destructive',
            title: 'Accès non autorisé',
            description: 'Mettez à niveau votre forfait pour accéder à ce niveau de risque.',
        });
        router.push('/pricing');
    }
  };


  const chartData = useMemo(() => {
    if (!prediction || !prediction.predictions) return [];
    return prediction.predictions.map((p) => ({
      name: p.time,
      crash: p.predictedCrashPoint,
    }));
  }, [prediction]);


  const chartConfig = {
    crash: {
      label: "Point de Crash",
      color: "hsl(var(--primary))",
    },
  };

  const { highestPrediction, lowestPrediction } = useMemo(() => {
    if (!prediction || !prediction.predictions || prediction.predictions.length === 0) {
      return { highestPrediction: null, lowestPrediction: null };
    }
    const highest = prediction.predictions.reduce((max, p) => p.predictedCrashPoint > max.predictedCrashPoint ? p : max, prediction.predictions[0]);
    const lowest = prediction.predictions.reduce((min, p) => p.predictedCrashPoint < min.predictedCrashPoint ? p : min, prediction.predictions[0]);
    return { highestPrediction: highest, lowestPrediction: lowest };
  }, [prediction]);
  
  const yAxisDomain = useMemo(() => {
    if (!prediction?.predictions || prediction.predictions.length === 0) {
      return [0, 10];
    }
    
    const predictionValues = prediction.predictions.map(p => p.predictedCrashPoint);
    const minPrediction = Math.min(...predictionValues);
    const maxPrediction = Math.max(...predictionValues);

    return [
      Math.floor(minPrediction * 0.9),
      Math.ceil(maxPrediction * 1.1)
    ];
  }, [prediction]);

  if (!isClient) {
    return (
      <div className="grid h-full w-full flex-1 place-content-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" />
      </div>
    );
  }

  const CopyButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2 sm:px-3"
      onClick={handleCopyPredictions}
      disabled={isCopied || !canCopy}
    >
      {isCopied ? (
        <Check className="h-4 w-4 text-green-500 sm:mr-2" />
      ) : (
        <Copy className="h-4 w-4 sm:mr-2" />
      )}
      <span className="hidden sm:inline">{isCopied ? 'Copié!' : 'Copier'}</span>
    </Button>
  );

  const PipButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2 sm:px-3"
      onClick={handlePictureInPicture}
      disabled={!canAccessPremiumFeatures}
    >
      <PictureInPicture className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Superposer</span>
    </Button>
  );

  return (
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <Card className="bg-card/50 border-border/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Contrôle de Prédiction IA</CardTitle>
            <CardDescription>
              Lancez une analyse pour obtenir des prédictions de cotes basées sur votre niveau de risque.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <RadioGroup
                value={riskLevel}
                onValueChange={handleRiskLevelChange}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {RISK_LEVELS.map((level) => {
                  const isAllowed = allowedRiskLevels.includes(level.id);
                  return (
                      <Label
                        key={level.id}
                        htmlFor={`risk-${level.id}`}
                        className={cn(
                            "relative flex flex-col items-start gap-2 cursor-pointer rounded-lg border-2 p-4 transition-all",
                            riskLevel === level.id && isAllowed ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]" : "border-muted/50 bg-muted/20 hover:bg-muted/40",
                            !isAllowed && "cursor-not-allowed opacity-60 bg-muted/10 hover:bg-muted/10"
                        )}
                    >
                      <RadioGroupItem value={level.id} id={`risk-${level.id}`} className="sr-only" disabled={!isAllowed} />
                      <div className={cn("rounded-full p-2", riskLevel === level.id && isAllowed ? "bg-primary/20 text-primary" : "bg-foreground/10 text-muted-foreground")}>
                        {level.icon}
                      </div>
                      <h4 className="font-bold text-foreground">{level.name}</h4>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                      {!isAllowed && (
                          <div className="absolute top-2 right-2 flex items-center justify-center bg-background/80 rounded-full p-1.5 border border-border">
                            <Lock className="h-4 w-4 text-yellow-400" />
                          </div>
                        )}
                    </Label>
                  )
                })}
              </RadioGroup>

            <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="history-input" className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Historique des crashs (séparé par des espaces)
                </Label>
                <Textarea
                  id="history-input"
                  value={historyInput}
                  onChange={(e) => setHistoryInput(e.target.value)}
                  placeholder="Ex: 1.23x 4.56 2.01 10.42..."
                  className="min-h-[80px] font-code bg-muted/30 border-dashed"
                  disabled={isPredicting || hasFuturePredictions}
                />
              </div>
              <Button
                onClick={handlePrediction}
                disabled={isPredicting || hasFuturePredictions || !historyInput.trim()}
                className="w-full lg:w-auto h-20 lg:h-full text-lg"
              >
                {isPredicting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-5 w-5" />
                )}
                Prédire
              </Button>
            </div>
            {hasFuturePredictions && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Une prédiction est déjà en cours. Attendez la fin pour en lancer une nouvelle.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-8">
           <Card className="relative flex flex-col bg-card/50 border-border/30 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 font-bold text-lg">
                        <Target className="h-5 w-5 text-primary" />
                        Prochaines Prédictions
                    </CardTitle>
                    {prediction?.predictions && prediction.predictions.length > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <TooltipProvider>
                                {!canCopy ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild><span><CopyButton /></span></TooltipTrigger>
                                        <TooltipContent><p>Passez au forfait Jour ou supérieur.</p></TooltipContent>
                                    </Tooltip>
                                ) : <CopyButton />}
                                {!canAccessPremiumFeatures ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild><span><PipButton /></span></TooltipTrigger>
                                        <TooltipContent><p>Passez au forfait Semaine ou Mois.</p></TooltipContent>
                                    </Tooltip>
                                ) : <PipButton />}
                            </TooltipProvider>
                        </div>
                    )}
                </CardHeader>
                
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                    {isPredicting ? (
                        <div className="flex h-full items-center justify-center p-6 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>Analyse en cours...</p>
                            </div>
                        </div>
                    ) : prediction?.predictions && prediction.predictions.length > 0 ? (
                        <div className="flex flex-col">
                            {prediction.predictions.map((p, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    onClick={() => handlePredictionClick(p)}
                                >
                                    <div className="flex items-center gap-4">
                                        <Clock className={cn("h-5 w-5", getPredictionTimeColor(p.time))} />
                                        <span className={cn("font-code text-lg font-semibold", getPredictionTimeColor(p.time))}>
                                            {p.time}
                                        </span>
                                    </div>
                                    <span className="font-code text-xl font-bold text-primary">
                                        {p.predictedCrashPoint.toFixed(2)}x
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-center text-muted-foreground gap-4">
                            <Target className="h-16 w-16 text-primary/30" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-foreground">Aucune prédiction</h3>
                                <p className="text-sm">Lancez une analyse pour voir les résultats ici.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>


         <div className="bg-card/50 border-border/30 backdrop-blur-md rounded-lg flex flex-col p-4 sm:p-6">
              <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground">Graphique des Prédictions</h3>
                  <p className="text-sm text-muted-foreground">Vue d'ensemble des prédictions à venir.</p>
              </div>
              {canAccessChart ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full flex-1">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                        <linearGradient id="fillCrash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border) / 0.3)"
                    />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                      domain={yAxisDomain}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <ChartTooltip 
                        cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background/90 p-2.5 shadow-sm backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Heure</span>
                                    <span className="font-bold text-foreground">{payload[0].payload.name}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">Cote</span>
                                    <span className="font-bold text-primary">{payload[0].value?.toFixed(2)}x</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }} 
                    />
                    <Area
                      dataKey="crash"
                      type="monotone"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#fillCrash)"
                    />
                    {highestPrediction && (
                      <ReferenceLine
                        y={highestPrediction.predictedCrashPoint}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      >
                        <Label value={`Max: ${highestPrediction.predictedCrashPoint.toFixed(2)}x`} position="insideTopLeft" fill="hsl(var(--primary))" fontSize={12} />
                      </ReferenceLine>
                    )}
                    {lowestPrediction && (
                      <ReferenceLine
                        y={lowestPrediction.predictedCrashPoint}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      >
                        <Label value={`Min: ${lowestPrediction.predictedCrashPoint.toFixed(2)}x`} position="insideBottomLeft" fill="hsl(var(--muted-foreground))" fontSize={12} />
                      </ReferenceLine>
                    )}
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 text-center">
                    <Lock className="h-10 w-10 text-primary/50 mb-4" />
                    <h3 className="font-semibold text-foreground">Fonctionnalité Premium</h3>
                    <p className="text-sm text-muted-foreground mb-4">Passez au forfait "Jour" ou supérieur pour voir le graphique.</p>
                    <Button size="sm" onClick={() => router.push('/pricing')}>Voir les forfaits</Button>
                </div>
              )}
            </div>
        </div>

        <Dialog open={isOverlayGuideOpen} onOpenChange={setIsOverlayGuideOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Activer la superposition</DialogTitle>
                    <DialogDescription>
                        Pour afficher les prédictions par-dessus d'autres applications, vous devez activer une permission manuellement.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm">
                    <p>
                        Malheureusement, nous ne pouvons pas vous rediriger directement. Voici comment faire :
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Allez dans les <strong>Paramètres</strong> de votre téléphone.</li>
                        <li>Cherchez et ouvrez la section <strong>"Applications"</strong>.</li>
                        <li>Trouvez et sélectionnez <strong>JetPredict</strong> dans la liste.</li>
                        <li>Cherchez l'option <strong>"Superposition à d'autres applications"</strong> (ou "Afficher par-dessus d'autres applis") et activez-la.</li>
                    </ol>
                    <p className="text-xs text-muted-foreground pt-2">
                        Cette fonctionnalité n'est pas disponible sur tous les appareils et dépend du système d'exploitation.
                    </p>
                </div>
            </DialogContent>
        </Dialog>

        <AnimatePresence>
            {isFullScreenPredictionOpen && fullScreenPredictionData && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
                    <motion.div
                        className="fixed inset-0 bg-black/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsFullScreenPredictionOpen(false)}
                    />
                    <motion.div
                        className="relative w-full h-full max-w-4xl max-h-[90vh] sm:max-h-[800px] bg-background/90 backdrop-blur-2xl border border-primary/20 rounded-2xl flex flex-col items-center justify-between p-4 sm:p-8 text-center overflow-hidden"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    >
                         {/* Background Elements */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>
                        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
                        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-primary/10 to-transparent -z-10"></div>
                        <div className="absolute inset-0 border-[6px] border-primary/20 rounded-2xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '3s' }}></div>

                        <div className="flex-shrink-0">
                            <p className="text-muted-foreground mb-1">Prédiction pour</p>
                            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                <h2 className="text-2xl sm:text-4xl font-bold text-primary font-code">{fullScreenPredictionData.time}</h2>
                            </div>
                        </div>
                        
                        <div className="flex-grow flex flex-col items-center justify-center">
                             <motion.div 
                                className="text-[15vw] sm:text-9xl md:text-[180px] lg:text-[220px] font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary via-blue-300 to-cyan-200"
                                style={{
                                    textShadow: "0 0 10px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.2)",
                                    WebkitTextStroke: "1px hsl(var(--primary) / 0.2)"
                                }}
                                animate={{ scale: [1, 1.03, 1]}}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                            >
                                {fullScreenPredictionData.predictedCrashPoint.toFixed(2)}x
                            </motion.div>
                        </div>
                       
                        <div className="w-full max-w-xl flex-shrink-0">
                            {isFetchingStrategies ? (
                                <div className="flex h-32 items-center justify-center p-4 text-muted-foreground">
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    <span className="text-lg">Analyse des stratégies par l'IA...</span>
                                </div>
                            ) : strategies ? (
                                <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                    <LayoutGroup id="strategy-selector">
                                        <div className="flex justify-center gap-4 mb-4">
                                            <button
                                                onClick={() => setSelectedStrategy('conservative')}
                                                className={cn("relative px-4 py-2 text-sm font-semibold rounded-full transition-colors", selectedStrategy === 'conservative' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                            >
                                                {selectedStrategy === 'conservative' && <motion.div layoutId="selector-underline" className="absolute inset-0 bg-green-500/10 rounded-full border border-green-500/30 -z-10" />}
                                                <div className="flex items-center gap-2">
                                                    <Shield className={cn("h-5 w-5", selectedStrategy === 'conservative' ? 'text-green-400' : 'text-muted-foreground')} />
                                                    Conservatrice
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setSelectedStrategy('aggressive')}
                                                className={cn("relative px-4 py-2 text-sm font-semibold rounded-full transition-colors", selectedStrategy === 'aggressive' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                                            >
                                                {selectedStrategy === 'aggressive' && <motion.div layoutId="selector-underline" className="absolute inset-0 bg-orange-500/10 rounded-full border border-orange-500/30 -z-10" />}
                                                <div className="flex items-center gap-2">
                                                     <Zap className={cn("h-5 w-5", selectedStrategy === 'aggressive' ? 'text-orange-400' : 'text-muted-foreground')} />
                                                    Agressive
                                                </div>
                                            </button>
                                        </div>
                                    </LayoutGroup>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={selectedStrategy}
                                            className="text-sm text-muted-foreground text-center"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {selectedStrategy === 'conservative' ? strategies.conservativeStrategy : strategies.aggressiveStrategy}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            ) : canAccessPremiumFeatures ? (
                                <p className="text-sm text-muted-foreground">Aucune stratégie disponible.</p>
                            ) : (
                                <div className="w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 text-center">
                                    <Lock className="h-10 w-10 text-primary/50 mb-4" />
                                    <h3 className="font-semibold text-foreground">Fonctionnalité Premium</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Passez au forfait "Semaine" ou "Mois" pour débloquer les stratégies de l'IA.</p>
                                    <Button size="sm" onClick={() => router.push('/pricing')}>Voir les forfaits</Button>
                                </div>
                            )}
                        </div>
                         <motion.button
                            className="absolute bottom-6 h-12 w-12 rounded-full bg-black/30 text-muted-foreground hover:text-foreground hover:bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center"
                            onClick={() => setIsFullScreenPredictionOpen(false)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <X />
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
  );
}






