

'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, ShieldCheck, Info, Trash2, CheckCheck, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch, getDocs, where, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { BellIcon, MailOpenIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    const icons = {
        referral: <Gift className="h-5 w-5 text-green-400" />,
        subscription: <ShieldCheck className="h-5 w-5 text-blue-400" />,
        global: <Megaphone className="h-5 w-5 text-purple-400" />,
        info: <Info className="h-5 w-5 text-yellow-400" />,
    };
    return (
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border">
            {icons[type] || icons.info}
        </div>
    );
};

export default function NotificationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [personalNotifications, setPersonalNotifications] = useState<Notification[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();

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
    if (!user || notification.isRead || notification.type === 'global') return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notification.id);
    await updateDoc(notificationRef, { isRead: true });
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

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
  
  const handleDeleteRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const readQuery = query(notificationsRef, where('isRead', '==', true));
    const readSnapshot = await getDocs(readQuery);

    readSnapshot.docs.forEach(document => {
        batch.delete(document.ref);
    });

    await batch.commit();
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

          <div className="mb-6 flex justify-end gap-2">
             <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                              <CheckCheck className="h-5 w-5" />
                              <span className="sr-only">Tout marquer comme lu</span>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Tout marquer comme lu</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={handleDeleteRead} disabled={personalNotifications.filter(n => n.isRead).length === 0}>
                              <Trash2 className="h-5 w-5" />
                              <span className="sr-only">Supprimer les notifications lues</span>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Supprimer les notifications lues</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
          </div>
      
          {allNotifications.length > 0 ? (
                <motion.div
                  className="relative flex flex-col gap-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
              >
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border/30 -z-10"></div>
                  {allNotifications.map((notif) => (
                      <motion.div
                          key={notif.id}
                          className="relative flex items-start gap-4"
                          variants={itemVariants}
                      >
                          <NotificationIcon type={notif.type} />
                          <motion.div
                              className={cn(
                                  "flex-1 -mt-1 p-5 rounded-xl border transition-all duration-300 w-full",
                                  !notif.isRead ? "bg-primary/5 border-primary/20 hover:border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.1),inset_0_1px_1px_hsl(var(--primary)/0.2)] cursor-pointer" : "bg-muted/30 border-border/30 hover:bg-muted/50",
                                  notif.type === 'global' && !notif.isRead && "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_15px_hsl(var(--primary)/0.1),inset_0_1px_1px_hsl(var(--primary)/0.2)]",
                                  notif.type === 'global' && "border-purple-500/30",
                              )}
                              onClick={() => handleNotificationClick(notif)}
                              whileHover={{ y: -3 }}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-foreground">{notif.title}</h3>
                                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                                      {notif.timestamp?.toDate().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
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

    
