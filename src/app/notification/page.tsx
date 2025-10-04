

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gift, ShieldCheck, Info, Trash2, CheckCheck, Megaphone, ExternalLink, MoreVertical, Eye, EyeOff, X, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch, getDocs, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { MailOpenIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/ui/sidebar';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'referral' | 'subscription' | 'info' | 'global';
    isRead: boolean;
    timestamp: any;
    link?: string;
    mediaUrl?: string;
}

const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const NotificationIcon = ({ type, isRead }: { type: Notification['type'], isRead: boolean }) => {
    const icons = {
        referral: <Gift className="h-5 w-5 text-green-400" />,
        subscription: <ShieldCheck className="h-5 w-5 text-blue-400" />,
        global: <Megaphone className="h-5 w-5 text-purple-400" />,
        info: <Info className="h-5 w-5 text-yellow-400" />,
    };
    return (
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-border/50 shadow-lg">
            {icons[type] || icons.info}
            {!isRead && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
                </div>
            )}
        </div>
    );
};

export default function NotificationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [personalNotifications, setPersonalNotifications] = useState<Notification[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const auth = getAuth(app);
  const router = useRouter();

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startSelectionMode = (notifId: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([notifId]));
  };

  const handleTouchStart = (notifId: string) => {
    longPressTimeoutRef.current = setTimeout(() => {
        startSelectionMode(notifId);
    }, 700);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, notifId: string) => {
    e.preventDefault();
    startSelectionMode(notifId);
  }

  const handleSelectionChange = (notifId: string) => {
    if (!selectionMode) return;
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(notifId)) {
            newSet.delete(notifId);
        } else {
            newSet.add(notifId);
        }
        return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === personalNotifications.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(personalNotifications.map(n => n.id)));
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (!user || selectedIds.size === 0) return;
    
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
        const notifRef = doc(db, 'users', user.uid, 'notifications', id);
        if (action === 'read') {
            batch.update(notifRef, { isRead: true });
        } else if (action === 'delete') {
            batch.delete(notifRef);
        }
    });

    await batch.commit();
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

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

      const pricingDocRef = doc(db, "users", currentUser.uid, "pricing", "jetpredict");
      const unsubscribePricing = onSnapshot(pricingDocRef, async (pricingDoc) => {
        if (pricingDoc.exists()) {
            const pricingData = pricingDoc.data();
            const isStillActive = pricingData.actif_jetpredict === true;
            const expirationDate = pricingData.findate?.toDate();

            if (isStillActive && expirationDate && expirationDate < new Date()) {
                await updateDoc(pricingDocRef, { actif_jetpredict: false });
                router.push('/pricing');
            } else if (isStillActive) {
                setUserPlan(pricingData.idplan_jetpredict);
            } else {
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

    return () => unsubscribeAuth();
  }, [auth, router]);
  
  useEffect(() => {
      if (!user || !userPlan) return;
      setIsLoading(true);

      const personalNotificationsRef = collection(db, 'users', user.uid, 'notifications');
      const qPersonal = query(personalNotificationsRef, orderBy('timestamp', 'desc'));
      const unsubscribePersonal = onSnapshot(qPersonal, (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Notification));
          setPersonalNotifications(fetchedNotifications);
          setIsLoading(false);
      });

      const globalNotificationsRef = collection(db, 'applications', 'VMrS6ltRDuKImzxAl3lR', 'notifications');
      const qGlobal = query(globalNotificationsRef, orderBy('createdAt', 'desc'));
      const unsubscribeGlobal = onSnapshot(qGlobal, (snapshot) => {
          const fetchedNotifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.currentEvents || 'Annonce',
              message: data.message,
              type: 'global',
              isRead: true, 
              timestamp: data.createdAt,
              targetUsers: data.targetUsers || [],
              mediaUrl: data.mediaUrl || null,
              link: data.link || null,
            } as Notification & { targetUsers: string[] };
          }).filter(n => {
              return n.targetUsers.length === 0 || n.targetUsers.includes(userPlan);
          });
          setGlobalNotifications(fetchedNotifications);
          setIsLoading(false);
      });

      return () => {
          unsubscribePersonal();
          unsubscribeGlobal();
      };

  }, [user, userPlan]);


  const allNotifications = useMemo(() => {
    return [...personalNotifications, ...globalNotifications].sort((a, b) => {
      const dateA = a.timestamp?.toDate() || new Date(0);
      const dateB = b.timestamp?.toDate() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [personalNotifications, globalNotifications]);

 const handleNotificationClick = async (notification: Notification) => {
    if (selectionMode) {
        handleSelectionChange(notification.id);
        return;
    }

    if (!user || notification.isRead || notification.type === 'global') return;
    
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notification.id);
    await updateDoc(notificationRef, { isRead: true });
  };
  
  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const unreadQuery = query(notificationsRef, where('isRead', '==', false));
    const unreadSnapshot = await getDocs(unreadQuery);

    unreadSnapshot.docs.forEach(document => {
        batch.update(document.ref, { isRead: true });
    });

    await batch.commit();
  };
  
  const handleDeleteAll = async (type: 'read' | 'all') => {
      if (!user) return;
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      let queryToDelete;

      if (type === 'read') {
          queryToDelete = query(notificationsRef, where('isRead', '==', true));
      } else {
          queryToDelete = query(notificationsRef);
      }
      
      const snapshot = await getDocs(queryToDelete);
      snapshot.docs.forEach(document => {
          batch.delete(document.ref);
      });
      await batch.commit();
  };
  
  const handleToggleRead = async (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!user || notif.type === 'global') return;
    const notifRef = doc(db, 'users', user.uid, 'notifications', notif.id);
    await updateDoc(notifRef, { isRead: !notif.isRead });
  };

  const handleDelete = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!user) return;
    const notifRef = doc(db, 'users', user.uid, 'notifications', notifId);
    await deleteDoc(notifRef);
  };


  const unreadCount = personalNotifications.filter(n => !n.isRead).length;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background items-center justify-center">
        <Image src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Loading..." width={100} height={100} className="animate-pulse" priority />
      </div>
    );
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
        staggerChildren: 0.1,
        },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-8">
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Centre de notifications</h1>
            <p className="text-muted-foreground mt-2">
              {unreadCount > 0 ? `Vous avez ${unreadCount} notification(s) non lue(s).` : 'Vous êtes à jour.'}
            </p>
          </div>
        
          <AnimatePresence>
            {selectionMode && (
                <motion.div 
                    className="mb-6 flex justify-between items-center gap-2 bg-muted/50 p-3 rounded-lg border border-border/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setSelectionMode(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                           {selectedIds.size === personalNotifications.length ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                           Tout Sél.
                        </Button>
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                             <Button variant="secondary" size="sm" onClick={() => handleBulkAction('read')}>
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Marquer comme lu
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                            </Button>
                        </div>
                    )}
                </motion.div>
            )}
          </AnimatePresence>
      
          {allNotifications.length > 0 ? (
                <motion.div
                  className="relative flex flex-col gap-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
              >
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/30 -z-10"></div>
                  {allNotifications.map((notif) => (
                      <motion.div
                          key={notif.id}
                          className="relative flex items-start gap-4 sm:gap-6"
                          variants={itemVariants}
                      >
                           <AnimatePresence>
                            {selectionMode && notif.type !== 'global' && (
                                <motion.div 
                                    className="z-20"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                >
                                    <Checkbox
                                        checked={selectedIds.has(notif.id)}
                                        onCheckedChange={() => handleSelectionChange(notif.id)}
                                        className="h-5 w-5 mt-3"
                                    />
                                </motion.div>
                            )}
                            </AnimatePresence>

                          <NotificationIcon type={notif.type} isRead={notif.isRead} />
                          <motion.div
                              className={cn(
                                "relative flex-1 -mt-1 p-5 rounded-lg border backdrop-blur-md transition-all duration-300 w-full overflow-hidden group",
                                "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:opacity-50",
                                !notif.isRead ? "border-primary/30 before:from-primary/10 before:to-transparent shadow-[0_0_25px_hsl(var(--primary)/0.1)]" : "border-border/30 before:from-muted/20 before:to-transparent",
                                notif.type === 'global' && "border-purple-500/30 before:from-purple-500/10",
                                selectionMode ? "cursor-pointer" : "hover:-translate-y-1 hover:shadow-lg",
                                selectedIds.has(notif.id) && "border-primary bg-primary/10"
                              )}
                              onClick={() => handleNotificationClick(notif)}
                              onContextMenu={(e) => notif.type !== 'global' && handleContextMenu(e, notif.id)}
                              onTouchStart={() => notif.type !== 'global' && handleTouchStart(notif.id)}
                              onTouchEnd={handleTouchEnd}
                              onTouchMove={handleTouchEnd}
                              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,hsla(0,0%,100%,.03)_25%,transparent_25%,transparent_50%,hsla(0,0%,100%,.03)_50%,hsla(0,0%,100%,.03)_75%,transparent_75%,transparent)] bg-[length:60px_60px] opacity-50 -z-10"></div>
                              
                               <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-foreground text-lg">{notif.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {notif.timestamp?.toDate().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                      {notif.type !== 'global' && !selectionMode && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onClick={(e) => handleToggleRead(e, notif)}>
                                                    {notif.isRead ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                                    <span>Marquer comme {notif.isRead ? 'non lu' : 'lu'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDelete(e, notif.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Supprimer</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                  </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{notif.message}</p>
                              
                              {notif.mediaUrl && (
                                  <div className="mt-3 rounded-lg overflow-hidden border border-border/50">
                                      {isVideo(notif.mediaUrl) ? (
                                          <video src={notif.mediaUrl} width={600} height={400} autoPlay loop muted playsInline className="w-full h-auto object-cover" />
                                      ) : (
                                          <Image src={notif.mediaUrl} alt={notif.title} width={600} height={400} className="w-full h-auto object-cover" />
                                      )}
                                  </div>
                              )}
                              {notif.link && (
                                <div className="mt-4">
                                  <Button
                                      size="sm"
                                      variant="ghost"
                                      className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                      onClick={(e) => handleLinkClick(e, notif.link!)}
                                  >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Voir
                                  </Button>
                                </div>
                              )}
                          </motion.div>
                      </motion.div>
                  ))}
              </motion.div>
          ) : (
              <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-6">
                  <MailOpenIcon className="h-20 w-20 text-primary/30" />
                  <div className="space-y-1">
                      <h3 className="text-xl font-semibold">Boîte de réception vide</h3>
                      <p className="text-sm max-w-xs">Vous n'avez aucune notification pour le moment. Nous vous informerons ici.</p>
                  </div>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
