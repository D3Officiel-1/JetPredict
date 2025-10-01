

'use client';

import { useState, useEffect, useCallback, FC, useRef } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, Wallet, History, Music, HelpCircle, Users, Send, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';

type GameState = 'IDLE' | 'WAITING' | 'BETTING' | 'IN_PROGRESS' | 'CRASHED';
type BetState = 'IDLE' | 'PENDING' | 'PLACED' | 'CASHED_OUT' | 'LOST';
type GameLevel = "Facile" | "Moyen" | "Difficile" | "Expert";
type PlayerStatus = 'waiting' | 'betting' | 'cashed_out' | 'lost';

interface BetPanelData {
  betState: BetState;
  betAmount: number;
  winAmount: number;
  isAutoBet: boolean;
  isAutoCashout: boolean;
  autoCashoutValue: number;
}

interface SimulatedPlayer {
    id: number | string;
    name: string;
    avatar: string;
    bet: number;
    status: PlayerStatus;
    cashoutMultiplier?: number;
}

interface ChatMessage {
    id: string;
    user: string;
    text: string;
    color: string;
    isUser?: boolean;
}


interface BetPanelProps {
  id: number;
  balance: number;
  gameState: GameState;
  betData: BetPanelData;
  onBet: (id: number, amount: number) => void;
  onCancel: (id: number) => void;
  onCashout: (id: number, cashoutMultiplier?: number) => void;
  onUpdate: (id: number, data: Partial<BetPanelData>) => void;
  multiplier: number;
}


const BETTING_TIME = 8000; // 8 seconds

const generateCrashPoint = (): number => {
  const r = Math.random();
  if (r < 0.6) return 1 + r * 2;       // 60% chance for 1x to 3x
  if (r < 0.9) return 2.2 + (r - 0.6) * 9.33; // 30% chance for 2.2x to 5x
  return 5 + (r - 0.9) * 45; // 10% chance for 5x to 50x
};


const generateRandomName = (): string => {
    const beginnings = ["Art", "S4a", "Bq", "Scar", "T10", "Khus", "Ид", "Sho", "Eno", "Mk", "Dee", "Ali", "Vik", "Pat", "Sсh"];
    const middles = ["ur", "sti", "CP", "pi", "Nb", "b", ":/", "m", "ck", "511", "pak", "sher", "toria", "i", "astliv"];
    const endings = ["", "ik", "ov", "er", "man", "88", "pro", "GG", "x7"];
    const beginning = beginnings[Math.floor(Math.random() * beginnings.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];
    return `${beginning}${middle}${ending}`;
}

const generateFakePlayers = (count: number): SimulatedPlayer[] => {
    const players = [];
    for (let i = 0; i < count; i++) {
        const name = generateRandomName();
        players.push({
            id: i,
            name: `${name.slice(0, 5)}...`,
            avatar: name.slice(0, 2).toUpperCase(),
            bet: 0,
            status: 'waiting',
        });
    }
    return players;
};

const fakeMessages = [
    { text: "Let's goooo! 🚀", color: "#60a5fa" },
    { text: "Big win incoming! 💰", color: "#4ade80" },
    { text: "Всем удачи!", color: "#a78bfa" },
    { text: "C'est maintenant ou jamais ! 🔥", color: "#fb923c" },
    { text: "Come on baby, fly high!", color: "#22d3ee" },
    { text: "Allez, on y croit fort !", color: "#facc15" },
    { text: "This is my round! 💪", color: "#f87171" },
    { text: "Suerte a todos! 🍀", color: "#4ade80" },
    { text: "Ну что, полетели?", color: "#a78bfa" },
    { text: "J'ai un bon pressentiment pour celle-ci.", color: "#60a5fa" },
    { text: "Where is the x100? 🤔", color: "#fb923c" },
    { text: "Venga, venga, que suba!", color: "#22d3ee" },
    { text: "Ого, какой кэф!", color: "#facc15" },
    { text: "I'm out, good luck guys.", color: "#f87171" },
    { text: "J'ai retiré trop tôt... 😭", color: "#60a5fa" },
    { text: "Easy money! 😎", color: "#4ade80" },
    { text: "Кто-нибудь вывел?", color: "#a78bfa" },
    { text: "What a crash... 📉", color: "#f87171" },
    { text: "¡Casi lo consigo!", color: "#fb923c" },
    { text: "Next one is the one!", color: "#22d3ee" }
];
const initialHistory = [2.10, 1.06, 2.76, 2.10, 2.12, 2.71, 18.73, 13.40, 5.58, 1.65, 4.25, 1.31, 1.25, 1.54, 1.69];
// --- END FAKE DATA ---

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: [number, number, number];
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const JetCanvasAnimation: FC<{ multiplier: number; gameState: GameState }> = ({ multiplier, gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const starsRef = useRef<Star[]>([]);
    const animationFrameId = useRef<number>();
    const lastTime = useRef<number>(0);

    // Initialize stars
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && starsRef.current.length === 0) {
            for (let i = 0; i < 150; i++) {
                starsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }
    }, []);

    const draw = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const deltaTime = (time - lastTime.current) / 16.67; // Normalize based on 60fps
        lastTime.current = time;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, "#0a0f1e");
        gradient.addColorStop(1, "#1a203c");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw and update stars
        ctx.fillStyle = 'white';
        starsRef.current.forEach(star => {
            star.y += 0.1 * deltaTime; // Slow downward scroll
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            ctx.globalAlpha = star.opacity;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;


        // Calculate progress (capped at a reasonable visual max)
        const visualMultiplier = Math.min(multiplier, 30);
        const progress = (visualMultiplier - 1) / (30 - 1);
        
        const curvePower = 0.6;
        const x = 50 + Math.pow(progress, curvePower) * (canvas.width - 150);
        const y = canvas.height - 50 - Math.pow(progress, curvePower) * (canvas.height - 100);

        // Update and draw particles
        particlesRef.current = particlesRef.current.map(p => {
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.opacity = (p.life / p.maxLife) * 0.8;
            return p;
        }).filter(p => p.life > 0);

        if (gameState === 'IN_PROGRESS') {
            for (let i = 0; i < 5; i++) { // Add new particles
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                const life = Math.random() * 60 + 30;
                particlesRef.current.push({
                    x: x,
                    y: y,
                    size: Math.random() * 3 + 1,
                    opacity: 1,
                    vx: Math.cos(angle) * speed * (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * speed * (Math.random() - 0.5) * 2 - 1, // Move upwards slightly
                    life: life,
                    maxLife: life,
                    color: Math.random() > 0.5 ? [255, 100, 255] : [0, 255, 255] // Magenta or Cyan
                });
            }
        }
        
        ctx.globalCompositeOperation = 'lighter'; // For bloom effect
        particlesRef.current.forEach(p => {
            const [r, g, b] = p.color;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over'; // Reset


        if (gameState === 'IN_PROGRESS') {
            // Draw the main "jet" head
            const coreSize = 8 + Math.sin(time / 150) * 2;
            const glowSize = coreSize * 3;
            
            const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.8, 'rgba(0, 255, 255, 1)');
            coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(x, y, coreSize, 0, Math.PI * 2);
            ctx.fill();

            // Outer glow
            const glowGradient = ctx.createRadialGradient(x, y, coreSize, x, y, glowSize);
            glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        animationFrameId.current = requestAnimationFrame(draw);
    }, [multiplier, gameState]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(draw);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw]);

    return <canvas ref={canvasRef} width={800} height={400} className="absolute inset-0 w-full h-full" />;
};


const BetPanel: FC<BetPanelProps> = ({ id, balance, gameState, betData, onBet, onCancel, onCashout, onUpdate, multiplier }) => {
  const { betState, betAmount, autoCashoutValue, isAutoBet, isAutoCashout } = betData;
  const { toast } = useToast();

  const handleBetClick = () => {
    if (gameState !== 'BETTING' || betState !== 'IDLE') return;
    if (betAmount > balance) {
        toast({ variant: 'destructive', title: 'Solde insuffisant' });
        return;
    }
    onBet(id, betAmount);
  };
  
  const handleCancelClick = () => {
      if ((gameState === 'BETTING' || gameState === 'WAITING') && betState === 'PENDING') {
          onCancel(id);
      }
  };

  const handleCashoutClick = () => {
      if (gameState === 'IN_PROGRESS' && betState === 'PLACED') {
          onCashout(id);
      }
  }

  const getButtonContent = () => {
    switch(betState) {
        case 'PENDING':
            return `ANNULER`;
        case 'PLACED':
            return `RETIRER ${(betAmount * multiplier).toLocaleString('fr-FR', {maximumFractionDigits: 0})} F`;
        case 'CASHED_OUT':
            return 'GAGNÉ';
        case 'LOST':
            return 'PERDU';
        default:
            return 'PARI';
    }
  };

  const getButtonClass = () => {
      switch(betState) {
        case 'PENDING': return 'bg-gray-500 hover:bg-gray-600';
        case 'PLACED': return 'bg-red-600 hover:bg-red-700';
        case 'CASHED_OUT': return 'bg-green-500 hover:bg-green-500 cursor-not-allowed';
        case 'LOST': return 'bg-gray-700 hover:bg-gray-700 cursor-not-allowed';
        default: return 'bg-purple-600 hover:bg-purple-700';
      }
  }

  const mainButtonClick = () => {
      if(betState === 'IDLE') handleBetClick();
      else if(betState === 'PENDING') handleCancelClick();
      else if(betState === 'PLACED') handleCashoutClick();
  }
  
  const quickSetBet = (amount: number) => onUpdate(id, { betAmount: amount });

  const isIdle = betState === 'IDLE';

  return (
    <div className="bg-[#242c48] rounded-lg p-2 md:p-3 space-y-2 md:space-y-3 text-white">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="space-y-1">
            <Label className="text-xs text-gray-400">Montant du pari</Label>
            <div className="relative">
                <Input type="number" value={betAmount} onChange={e => onUpdate(id, { betAmount: Number(e.target.value) })} className="bg-[#10142a] border-gray-700 text-center text-sm md:text-lg font-bold w-full pr-8 h-8 md:h-10" disabled={!isIdle} />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-full">
                <button onClick={() => onUpdate(id, { betAmount: betAmount + 10 })} disabled={!isIdle} className="h-1/2 px-1 text-gray-400 hover:text-white disabled:text-gray-600"><Plus size={14} /></button>
                <button onClick={() => onUpdate(id, { betAmount: Math.max(10, betAmount - 10) })} disabled={!isIdle} className="h-1/2 px-1 text-gray-400 hover:text-white disabled:text-gray-600"><Minus size={14} /></button>
                </div>
            </div>
            </div>

            <div className="space-y-1">
            <Label className="text-xs text-gray-400">Retrait Auto.</Label>
            <div className="relative">
                <Input type="number" step="0.01" value={autoCashoutValue} onChange={e => onUpdate(id, { autoCashoutValue: Number(e.target.value) })} className="bg-[#10142a] border-gray-700 text-center text-sm md:text-lg font-bold w-full pr-8 h-8 md:h-10" disabled={!isIdle} />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-full">
                <button onClick={() => onUpdate(id, { autoCashoutValue: autoCashoutValue + 0.1 })} disabled={!isIdle} className="h-1/2 px-1 text-gray-400 hover:text-white disabled:text-gray-600"><Plus size={14} /></button>
                <button onClick={() => onUpdate(id, { autoCashoutValue: Math.max(1.01, autoCashoutValue - 0.1) })} disabled={!isIdle} className="h-1/2 px-1 text-gray-400 hover:text-white disabled:text-gray-600"><Minus size={14} /></button>
                </div>
            </div>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-2">
            {[50, 100, 200, 500].map(val => (
            <Button key={val} size="sm" className="bg-[#303a5c] hover:bg-[#414e7a] text-xs h-6 md:h-7 w-full" onClick={() => quickSetBet(val)} disabled={!isIdle}>+{val}</Button>
            ))}
        </div>
      
        <div className="flex items-center justify-around gap-4 pt-1">
            <div className="flex items-center gap-2">
                <Switch id={`auto-bet-${id}`} checked={betData.isAutoBet} onCheckedChange={(checked) => onUpdate(id, { isAutoBet: checked })} />
                <Label htmlFor={`auto-bet-${id}`} className="text-xs">Pari auto</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id={`auto-cashout-${id}`} checked={betData.isAutoCashout} onCheckedChange={(checked) => onUpdate(id, { isAutoCashout: checked })} />
                <Label htmlFor={`auto-cashout-${id}`} className="text-xs">Retrait auto</Label>
            </div>
        </div>

        <Button
            className={cn("w-full h-10 md:h-12 text-sm md:text-lg font-bold transition-all duration-200", getButtonClass())}
            onClick={mainButtonClick}
            disabled={(betState === 'IDLE' && gameState !== 'BETTING') || betState === 'CASHED_OUT' || betState === 'LOST'}
        >
            {getButtonContent()}
        </Button>
    </div>
  );
};


const MultiplierDisplay: FC<{ multiplier: number; gameState: GameState; crashPoint: number }> = ({ multiplier, gameState, crashPoint }) => {
    let colorClass = "text-white";
    let content;

    if (gameState === 'CRASHED') {
        colorClass = "text-red-500";
        content = `Parti à ${crashPoint.toFixed(2)}x`;
    } else if (multiplier > 10) {
        colorClass = "text-purple-400";
        content = `${multiplier.toFixed(2)}x`;
    } else if (multiplier > 2) {
        colorClass = "text-green-400";
        content = `${multiplier.toFixed(2)}x`;
    } else {
        content = `${multiplier.toFixed(2)}x`;
    }

    if (gameState === 'WAITING' || gameState === 'IDLE') {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xl text-white/50">En attente du prochain tour...</p>
                <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={80} height={80} className="animate-pulse mt-2" />
            </div>
        );
    }
    
    if (gameState === 'BETTING') {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl text-white/50">Placez vos paris maintenant !</p>
            </div>
        );
    }

    return (
        <div className={cn("absolute inset-0 flex items-center justify-center font-bold transition-colors duration-300 z-10", colorClass)}
             style={{
                fontSize: gameState === 'CRASHED' ? 'clamp(2rem, 10vw, 4rem)' : 'clamp(3rem, 15vw, 7rem)',
                textShadow: `0 0 25px ${colorClass === 'text-white' ? 'rgba(255,255,255,0.3)' : 'currentColor'}`
            }}
        >
            {content}
        </div>
    );
};

export default function SimulationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{username: string} | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<number[]>(initialHistory);
  const [gameLevel, setGameLevel] = useState<GameLevel | null>(null);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(true);

  const [bet1Data, setBet1Data] = useState<BetPanelData>({ betState: 'IDLE', betAmount: 120, winAmount: 0, isAutoBet: false, isAutoCashout: false, autoCashoutValue: 2.00 });
  const [bet2Data, setBet2Data] = useState<BetPanelData>({ betState: 'IDLE', betAmount: 120, winAmount: 0, isAutoBet: false, isAutoCashout: false, autoCashoutValue: 2.00 });
  
  const [simulatedPlayers, setSimulatedPlayers] = useState<SimulatedPlayer[]>([]);
  const [totalBetsCount, setTotalBetsCount] = useState(0);
  const [totalBetAmount, setTotalBetAmount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const bet1DataRef = useRef(bet1Data);
  const bet2DataRef = useRef(bet2Data);
  useEffect(() => { bet1DataRef.current = bet1Data; }, [bet1Data]);
  useEffect(() => { bet2DataRef.current = bet2Data; }, [bet2Data]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        const chatInterval = setInterval(() => {
            const randomMessage = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
            const randomName = generateRandomName();
            const newMessage: ChatMessage = {
                id: `${Date.now()}-${Math.random()}`,
                user: randomName,
                ...randomMessage,
            };
            setChatMessages(prev => [...prev.slice(-10), newMessage]);
        }, Math.random() * 5000 + 3000);

        return () => clearInterval(chatInterval);
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() === '' || !userData) return;
        const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            user: userData.username,
            text: chatInput,
            color: '#f472b6', // A distinct color for the user
            isUser: true,
        };
        setChatMessages(prev => [...prev.slice(-10), newMessage]);
        setChatInput('');
    };

  const handleBet = useCallback((id: number, amount: number) => {
    const betSetter = id === 1 ? setBet1Data : setBet2Data;
    setBalance(bal => {
      if (amount > bal) {
        toast({ variant: 'destructive', title: 'Solde insuffisant' });
        return bal;
      }
      betSetter(prev => ({
        ...prev,
        betState: 'PENDING',
        betAmount: amount,
        winAmount: 0,
      }));

      if (userData?.username) {
        setSimulatedPlayers(players => {
            const userPlayer: SimulatedPlayer = {
                id: `user-${id}`,
                name: userData.username,
                avatar: userData.username.slice(0, 2).toUpperCase(),
                bet: amount,
                status: 'betting'
            };
            const otherPlayers = players.filter(p => p.id !== `user-${id}`);
            return [userPlayer, ...otherPlayers];
        });
      }

      return bal - amount;
    });
  }, [toast, userData]);

  const handleCancel = useCallback((id: number) => {
      const betSetter = id === 1 ? setBet1Data : setBet2Data;
      betSetter(prev => {
          setBalance(bal => bal + prev.betAmount);
          setSimulatedPlayers(players => players.filter(p => p.id !== `user-${id}`));
          return { ...prev, betState: 'IDLE' };
      });
  }, []);

  const handleCashout = useCallback((id: number, cashoutMultiplier?: number) => {
      const betRef = id === 1 ? bet1DataRef : bet2DataRef;
      const betSetter = id === 1 ? setBet1Data : setBet2Data;
      
      if (betRef.current.betState !== 'PLACED') return;

      const finalMultiplier = cashoutMultiplier || multiplier;

      const winAmount = betRef.current.betAmount * finalMultiplier;
      setBalance(bal => bal + winAmount);
      toast({ title: "Gagné !", description: `Vous avez retiré ${winAmount.toLocaleString('fr-FR')} FCFA à x${finalMultiplier.toFixed(2)}` });
      
      betSetter(prev => ({ ...prev, betState: 'CASHED_OUT', winAmount }));

  }, [multiplier, toast]);
  
  const handleUpdateBet = useCallback((id: number, data: Partial<BetPanelData>) => {
      const betSetter = id === 1 ? setBet1Data : setBet2Data;
      betSetter(prev => ({...prev, ...data}));
  }, []);

  useEffect(() => {
    // Update player list based on bet state changes
    const updatePlayerFromBet = (betId: number, betData: BetPanelData) => {
        if (!userData?.username) return;
        const playerId = `user-${betId}`;

        setSimulatedPlayers(players => {
            const playerIndex = players.findIndex(p => p.id === playerId);
            if (playerIndex === -1 && betData.betState !== 'IDLE' && betData.betState !== 'PENDING') return players;
            if (playerIndex === -1) return players;

            const updatedPlayers = [...players];
            const player = updatedPlayers[playerIndex];

            if (betData.betState === 'CASHED_OUT') {
                player.status = 'cashed_out';
                player.cashoutMultiplier = betData.winAmount / betData.betAmount;
            } else if (betData.betState === 'LOST') {
                player.status = 'lost';
            } else if (betData.betState === 'PLACED') {
                player.status = 'betting';
                player.bet = betData.betAmount;
            }
            
            return updatedPlayers;
        });
    };
    updatePlayerFromBet(1, bet1Data);
    updatePlayerFromBet(2, bet2Data);
  }, [bet1Data, bet2Data, userData]);


  const gameLoop = useCallback(() => {
    setGameState('WAITING');
    setMultiplier(1.00);
    setSimulatedPlayers(generateFakePlayers(15));
    setTotalBetsCount(0);
    setTotalBetAmount(0);
    
    if (bet1DataRef.current.isAutoBet && balance < bet1DataRef.current.betAmount) {
        toast({ variant: 'destructive', title: 'Pari auto annulé', description: 'Solde insuffisant pour le pari 1.'});
        setBet1Data(b => ({ ...b, isAutoBet: false }));
    }
    
    if (bet2DataRef.current.isAutoBet && balance < bet2DataRef.current.betAmount) {
        toast({ variant: 'destructive', title: 'Pari auto annulé', description: 'Solde insuffisant pour le pari 2.'});
        setBet2Data(b => ({ ...b, isAutoBet: false }));
    }

    const waitTimer = setTimeout(() => {
        setGameState('BETTING');
        
        let bettingInterval: NodeJS.Timeout;
        
        const simulateBetting = () => {
          setSimulatedPlayers(players => {
            const playersToBet = players.filter(p => p.status === 'waiting');
            if (playersToBet.length === 0) {
              clearInterval(bettingInterval);
              return players;
            }
            const playerToUpdate = playersToBet[Math.floor(Math.random() * playersToBet.length)];
            const betAmount = Math.floor(Math.random() * 5000) + 100;
            setTotalBetsCount(c => c + 1);
            setTotalBetAmount(a => a + betAmount);
            return players.map(p => 
              p.id === playerToUpdate.id 
                ? { ...p, status: 'betting', bet: betAmount }
                : p
            );
          });
        };
        bettingInterval = setInterval(simulateBetting, 400);

        if (bet1DataRef.current.isAutoBet && balance >= bet1DataRef.current.betAmount) {
            handleBet(1, bet1DataRef.current.betAmount);
        }
        if (bet2DataRef.current.isAutoBet && balance >= bet2DataRef.current.betAmount) {
            handleBet(2, bet2DataRef.current.betAmount);
        }

        const bettingTimer = setTimeout(() => {
            clearInterval(bettingInterval);
             const userBetsCount = (bet1DataRef.current.betState === 'PENDING' ? 1 : 0) + (bet2DataRef.current.betState === 'PENDING' ? 1 : 0);
            const userBetsAmount = (bet1DataRef.current.betState === 'PENDING' ? bet1DataRef.current.betAmount : 0) + (bet2DataRef.current.betState === 'PENDING' ? bet2DataRef.current.betAmount : 0);
            setTotalBetsCount(c => c + userBetsCount);
            setTotalBetAmount(a => a + userBetsAmount);

            setSimulatedPlayers(players => players.map(p => {
                if (p.status === 'waiting') {
                    const betAmount = Math.floor(Math.random() * 5000) + 100;
                    setTotalBetsCount(c => c + 1);
                    setTotalBetAmount(a => a + betAmount);
                    return { ...p, status: 'betting', bet: betAmount };
                }
                return p;
            }));


            const newCrashPoint = generateCrashPoint();
            setCrashPoint(newCrashPoint);
            setGameState('IN_PROGRESS');

            setBet1Data(b => b.betState === 'PENDING' ? { ...b, betState: 'PLACED' } : b);
            setBet2Data(b => b.betState === 'PENDING' ? { ...b, betState: 'PLACED' } : b);
            
            let currentMultiplier = 1.00;
            let stopAnimation = false;
            let animationFrameId: number;

            const animate = () => {
                if (stopAnimation) return;
                
                const baseSpeed = 0.015;
                const acceleration = 0.0001;
                currentMultiplier += baseSpeed + (acceleration * Math.pow(currentMultiplier, 2));

                setMultiplier(currentMultiplier);
                
                // Simulate players cashing out
                setSimulatedPlayers(players => players.map(p => {
                    if (p.status === 'betting' && typeof p.id === 'number' && Math.random() < 0.01) { // Random chance to cash out for bots
                         setTotalBetsCount(c => c - 1);
                        return { ...p, status: 'cashed_out', cashoutMultiplier: currentMultiplier };
                    }
                    return p;
                }));

                if (bet1DataRef.current.betState === 'PLACED' && bet1DataRef.current.isAutoCashout && currentMultiplier >= bet1DataRef.current.autoCashoutValue) {
                    handleCashout(1, bet1DataRef.current.autoCashoutValue);
                }
                if (bet2DataRef.current.betState === 'PLACED' && bet2DataRef.current.isAutoCashout && currentMultiplier >= bet2DataRef.current.autoCashoutValue) {
                    handleCashout(2, bet2DataRef.current.autoCashoutValue);
                }

                if (currentMultiplier >= newCrashPoint) {
                    stopAnimation = true;
                    setGameState('CRASHED');
                    setHistory(h => [newCrashPoint, ...h.slice(0, 14)]);

                    setBet1Data(b => b.betState === 'PLACED' ? {...b, betState: 'LOST'} : b);
                    setBet2Data(b => b.betState === 'PLACED' ? {...b, betState: 'LOST'} : b);
                    setSimulatedPlayers(players => players.map(p => p.status === 'betting' ? {...p, status: 'lost'} : p));


                    setTimeout(() => {
                        setBet1Data(b => ({ ...b, betState: 'IDLE', winAmount: 0 }));
                        setBet2Data(b => ({ ...b, betState: 'IDLE', winAmount: 0 }));
                        gameLoop();
                    }, 4000);
                } else {
                   animationFrameId = requestAnimationFrame(animate);
                }
            };
            animationFrameId = requestAnimationFrame(animate);

            return () => cancelAnimationFrame(animationFrameId);

        }, BETTING_TIME);
        
        return () => {
          clearTimeout(bettingTimer);
          clearInterval(bettingInterval);
        }

    }, 5000);

    return () => clearTimeout(waitTimer);
  }, [handleBet, handleCashout, toast, balance]);

  useEffect(() => {
      let gameLoopTimeout: NodeJS.Timeout;
      if (gameLevel !== null && gameState === 'IDLE') {
          gameLoopTimeout = setTimeout(gameLoop, 1000);
      }
      return () => clearTimeout(gameLoopTimeout);
  }, [gameLevel, gameState, gameLoop]);


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
      
      const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
      const unsubscribePricing = onSnapshot(pricingDocRef, async (pricingDoc) => {
        if (pricingDoc.exists()) {
            const pricingData = pricingDoc.data();
            const planId = pricingData.idplan_jetpredict;
            const isStillActive = pricingData.actif_jetpredict === true;
            const expirationDate = pricingData.findate?.toDate();

            if (!isStillActive || (expirationDate && expirationDate < new Date())) {
                if(isStillActive) await updateDoc(pricingDocRef, { actif_jetpredict: false });
                router.push('/pricing');
                return;
            }

            if (planId === 'weekly' || planId === 'monthly') {
                const userDocRef = doc(db, "users", currentUser.uid);
                const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
                    if (userDoc.exists()) {
                        setUserData(userDoc.data() as {username: string});
                    }
                });
                setUser(currentUser);
                return () => unsubscribeUser();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Accès non autorisé',
                    description: "Vous devez avoir un forfait Semaine ou Mois pour accéder à la simulation.",
                });
                router.push('/pricing');
            }
        } else {
          router.push('/pricing');
        }
      }, (error) => {
        console.error("Erreur lors de la lecture des données de tarification:", error);
        router.push('/login');
      });

      return () => unsubscribePricing();
    });
    return () => unsubscribe();
  }, [auth, router, toast]);
  
  const getHistoryColor = (val: number) => {
      if (val >= 10) return 'text-purple-400';
      if (val >= 2) return 'text-green-400';
      return 'text-blue-400';
  }

  const selectLevel = (level: GameLevel) => {
    setGameLevel(level);
    switch(level) {
        case 'Facile': setBalance(10000); break;
        case 'Moyen': setBalance(5000); break;
        case 'Difficile': setBalance(1000); break;
        case 'Expert': setBalance(500); break;
    }
    setIsLevelSelectorOpen(false);
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#1a203c] items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" />
      </div>
    );
  }
  
  const getPlayerStatusDisplay = (player: SimulatedPlayer) => {
    switch (player.status) {
        case 'betting':
            return <span className="font-bold text-gray-300">{player.bet.toLocaleString('fr-FR')} F</span>;
        case 'cashed_out':
            return (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-green-400">
                        {(player.bet * (player.cashoutMultiplier || 0)).toLocaleString('fr-FR', {maximumFractionDigits: 0})} F
                    </span>
                    <span className="text-xs text-green-400/70">@{player.cashoutMultiplier?.toFixed(2)}x</span>
                </div>
            );
        case 'lost':
            return <span className="font-bold text-red-500 line-through">{player.bet.toLocaleString('fr-FR')} F</span>;
        default:
            return <span className="text-gray-500">En attente...</span>;
    }
};

const PlayerList = () => (
    <div className='p-2 md:p-0'>
        <div className="md:hidden flex items-center justify-between text-xs mb-2 text-gray-400 bg-[#161e38]/70 p-2 rounded-md">
            <span>Total des mises: {totalBetsCount}</span>
            <span>{totalBetAmount.toLocaleString('fr-FR')} F</span>
        </div>
        <div className="space-y-1">
            {simulatedPlayers.map((player) => (
                <div key={player.id} className={cn(
                    "flex items-center justify-between p-2 rounded-md text-sm transition-all duration-300", 
                    player.status === 'waiting' && 'opacity-50',
                    typeof player.id === 'string' && player.id.startsWith('user-') ? 'bg-purple-500/20 border border-purple-500' : 'bg-[#242c48]/50'
                )}>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gray-600">{player.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="truncate w-20">{player.name}</span>
                    </div>
                    {getPlayerStatusDisplay(player)}
                </div>
            ))}
        </div>
    </div>
);

const ChatPanel = () => (
    <div className="flex flex-col h-full">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm flex gap-2 items-start">
                    <Avatar className="h-5 w-5 mt-0.5">
                        <AvatarFallback className={cn("text-xs", msg.isUser && "bg-pink-400")} style={{backgroundColor: !msg.isUser ? msg.color : undefined}}>{msg.user.slice(0,1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <span className="font-bold" style={{color: msg.isUser ? '#f472b6' : msg.color}}>{msg.user}</span>
                        <p className="text-white/80 text-xs leading-tight">{msg.text}</p>
                    </div>
                </div>
            ))}
            <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="mt-2 relative">
            <Input placeholder="Tapez un message" className="bg-[#10142a] border-gray-700 pr-10" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
            <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                <Send size={18}/>
            </Button>
        </form>
    </div>
);

  return (
    <>
    <Dialog open={isLevelSelectorOpen}>
        <DialogContent className="bg-[#1a203c] border-gray-700 text-white" hideCloseButton={true}>
            <DialogHeader>
                <DialogTitle>Choisissez votre niveau de difficulté</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Votre solde de départ dépendra de la difficulté choisie.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-4">
                <Button variant="outline" className="h-20 flex flex-col bg-[#242c48] border-gray-600 hover:bg-[#303a5c]" onClick={() => selectLevel('Facile')}>
                    <span className="text-lg">😀 Facile</span>
                    <span className="text-sm text-gray-400">10,000 FCFA</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col bg-[#242c48] border-gray-600 hover:bg-[#303a5c]" onClick={() => selectLevel('Moyen')}>
                    <span className="text-lg">🙂 Moyen</span>
                    <span className="text-sm text-gray-400">5,000 FCFA</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col bg-[#242c48] border-gray-600 hover:bg-[#303a5c]" onClick={() => selectLevel('Difficile')}>
                    <span className="text-lg">😎 Difficile</span>
                    <span className="text-sm text-gray-400">1,000 FCFA</span>
                </Button>
                <Button variant="destructive" className="h-20 flex flex-col" onClick={() => selectLevel('Expert')}>
                    <span className="text-lg">😈 Expert</span>
                    <span className="text-sm">500 FCFA</span>
                </Button>
            </div>
        </DialogContent>
    </Dialog>

    <div className="bg-[#10142a] text-white font-body flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-2 bg-[#10142a] border-b border-gray-700/50 sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <Link href="/predict" className="p-2 rounded-md hover:bg-gray-700">
                <ArrowLeft size={20} />
            </Link>
            <img src="https://i.postimg.cc/13fR0G45/LUCKYJET.png" alt="LuckyJet" className="w-auto h-5"/>
        </div>
        <div className="flex-1 flex justify-center">
            <img src="https://i.postimg.cc/44pTkWw0/1win-logo-transparent.png" alt="1win" className="w-auto h-6" />
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"><Music size={20}/></Button>
            <Button variant="ghost" className="hidden md:flex items-center gap-1"><HelpCircle size={16}/>Comment jouer?</Button>
            <div className="bg-purple-600 rounded-md px-3 py-1.5 flex items-center gap-2">
                <Wallet size={16}/>
                <span className="font-bold">{balance.toLocaleString('fr-FR')} F</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 lg:grid lg:grid-cols-[240px_1fr_280px] overflow-y-auto">
        
        {/* Left Panel */}
        <aside className="hidden lg:flex flex-col bg-[#161e38]/70 p-2 border-r border-gray-700/50 overflow-y-auto">
            <div className="flex items-center justify-between text-xs mb-2 text-gray-400 bg-[#161e38]/70 p-2 rounded-md">
                <span>Total des mises: {totalBetsCount}</span>
                <span>{totalBetAmount.toLocaleString('fr-FR')} F</span>
            </div>
           <PlayerList />
        </aside>

        {/* Center Panel */}
        <div className="flex flex-col">
            <main className="flex flex-col relative flex-grow">
                {/* History */}
                <div className="p-2 overflow-x-auto whitespace-nowrap relative z-10">
                    <div className="flex gap-1 items-center">
                        <Button variant="ghost" size="icon" className="bg-gray-800/50"><History size={16}/></Button>
                        {history.map((h, i) => (
                            <div key={i} className={cn("px-3 py-1 rounded-full text-sm font-bold bg-black/20 backdrop-blur-sm cursor-pointer", getHistoryColor(h))}>
                                {h.toFixed(2)}x
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Area */}
                <div className="flex-1 relative overflow-hidden min-h-[300px] sm:min-h-[400px]">
                    <JetCanvasAnimation multiplier={multiplier} gameState={gameState} />
                    <MultiplierDisplay multiplier={multiplier} gameState={gameState} crashPoint={crashPoint}/>
                </div>
            </main>
             {/* Bet Controls */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-[#10142a] border-t border-gray-700/50">
                    <BetPanel id={1} balance={balance} gameState={gameState} betData={bet1Data} onBet={handleBet} onCancel={handleCancel} onCashout={handleCashout} onUpdate={handleUpdateBet} multiplier={multiplier} />
                    <BetPanel id={2} balance={balance} gameState={gameState} betData={bet2Data} onBet={handleBet} onCancel={handleCancel} onCashout={handleCashout} onUpdate={handleUpdateBet} multiplier={multiplier} />
            </div>

            {/* Mobile Player List and Chat */}
            <div className="lg:hidden p-2 space-y-4">
                 <PlayerList />
                 <div className="bg-[#161e38]/70 p-2 rounded-lg h-80">
                    <ChatPanel />
                 </div>
            </div>
        </div>

        {/* Right Panel */}
        <aside className="hidden lg:flex flex-col bg-[#161e38]/70 p-2 border-l border-gray-700/50">
           <ChatPanel />
        </aside>

      </div>
    </div>
    </>
  );
}