
import TelegramBot from 'node-telegram-bot-api';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc, serverTimestamp, writeBatch, orderBy, Timestamp, arrayUnion } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { predictCrashPoint, PredictCrashPointInput } from '@/ai/flows/predict-crash-point';
import { PlanId, PromoCode } from '@/types';

const token = process.env.TELEGRAM_BOT_TOKEN_PROD || process.env.TELEGRAM_BOT_TOKEN_DEV || process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jetpredict.vercel.app';
const supportPhoneNumber = "2250546511723"; // Numéro de téléphone pour le support WhatsApp
const whatsAppChannelUrl = "https://www.whatsapp.com/channel/0029VbBc22V4yltHAKWD0R2x";
const telegramChannelUrl = "https://t.me/Predict_D3officiel";


if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

export const bot = new TelegramBot(token);

// Définir les commandes du menu du bot
bot.setMyCommands([
  { command: '/start', description: '🚀 Démarrer le bot' },
  { command: '/whatsapp', description: '📱 Rejoindre la chaîne WhatsApp' },
  { command: '/telegram', description: '✈️ Rejoindre le canal Telegram' },
  { command: '/whoami', description: '👤 Afficher mon profil' },
  { command: '/jetgame', description: '🎮 Lancer le jeu de simulation' },
  { command: '/unlink', description: '❌ Délier mon compte de ce chat' },
]);


const PLAN_RISK_LEVELS: Record<PlanId, string[]> = {
    hourly: ["Faible"],
    daily: ["Faible", "Modéré"],
    weekly: ["Faible", "Modéré", "Élevé"],
    monthly: ["Faible", "Modéré", "Élevé", "Très élevé"],
};

const paymentMethods = ["Wave", "Orange Money", "MTN Money", "Moov Money"];

type UserState = {
  step: 'awaiting_linking_token' | 'awaiting_username' | 'awaiting_email_login' | 'awaiting_password_login' | 'awaiting_profile_edit' | 'awaiting_firstname' | 'awaiting_lastname' | 'awaiting_username_edit' | 'awaiting_phone' | 'awaiting_favorite_game' | 'awaiting_pronostiqueur_code' | 'awaiting_history' | 'awaiting_registration_email' | 'awaiting_registration_password' | 'awaiting_registration_confirm_password' | 'awaiting_change_password_current' | 'awaiting_change_password_new' | 'awaiting_change_password_confirm' | 'awaiting_change_email_password' | 'awaiting_change_email_new' | 'awaiting_promo_code_decision' | 'awaiting_promo_code_input' | 'awaiting_payment_method';
  data?: any;
};

const userStates: { [key: number]: UserState } = {};

const sendStartMenu = async (chatId: number, text: string) => {
    const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
    const userSnapshot = await getDocs(userQuery);
    
    const isLinked = !userSnapshot.empty;
    const username = isLinked ? userSnapshot.docs[0].data().username : "Visiteur";

    const welcomeMessage = `*Bienvenue, ${username} !* ✈️\n\n${text}\n\nUtilisez les commandes ci-dessous pour naviguer.`;

    const communityButtons = [
        { text: '📱 Chaîne WhatsApp', url: whatsAppChannelUrl },
        { text: '✈️ Canal Telegram', url: telegramChannelUrl },
    ];

    const keyboard_unlinked = {
        inline_keyboard: [
            [{ text: '🔗 Lier un Compte', callback_data: 'link_account' }, { text: '📝 Créer un Compte', callback_data: 'create_account' }],
            [{ text: '💎 Voir les Forfaits', callback_data: 'buy_subscription' }, { text: '🌐 Visiter le Site', url: appUrl }],
            communityButtons,
        ]
    };
    
    const keyboard_linked = {
        inline_keyboard: [
            [{ text: '🚀 Lancer une Prédiction', callback_data: 'predict' }],
            [{ text: '👤 Mon Profil', callback_data: 'edit_profile' }, { text: '💎 Gérer l\'Abonnement', callback_data: 'buy_subscription' }],
            [{ text: '🎮 Jeu de Simulation', callback_data: 'play_game' }, { text: '🌐 Visiter le Site', url: appUrl }],
            communityButtons,
        ]
    };

    const keyboard = isLinked ? keyboard_linked : keyboard_unlinked;

    await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
    });
};

const sendProfileEditMenu = async (chatId: number) => {
    const keyboard = {
        inline_keyboard: [
            [
                { text: '👤 Prénom/Nom', callback_data: 'edit_firstname' },
                { text: '🆔 Pseudo', callback_data: 'edit_username' }
            ],
            [
                { text: '📞 Téléphone', callback_data: 'edit_phone' },
                { text: '🎮 Jeu Préféré', callback_data: 'edit_favorite_game' }
            ],
            [
                { text: '✨ Code Promo (1xBet...)', callback_data: 'edit_pronostiqueur_code' }
            ],
            [
                { text: '📧 Changer d\'Email', callback_data: 'change_email' },
                { text: '🔑 Changer Mot de Passe', callback_data: 'change_password' }
            ],
            [{ text: '🔙 Retour', callback_data: 'back_to_main' }]
        ]
    };
    await bot.sendMessage(chatId, "⚙️ *Gestion du Profil*\n\nQuelle information souhaitez-vous modifier ?", { reply_markup: keyboard, parse_mode: 'Markdown' });
};

const generateWhatsAppLink = (chatId: number, planData: any, price: number, userData: any, paymentMethod: string, promoData: PromoCode | null) => {
    const userDocId = query(collection(db, "users"), where("telegramChatId", "==", chatId));

    let message = `*Activation de Forfait JetPredict*

Bonjour,

Je souhaite souscrire au forfait suivant :

*Forfait* : ${planData.name}
*ID* : ${planData.period}
*Prix initial* : ${planData.promoPrice ?? planData.price} ${planData.currency}`;

    if (promoData) {
        message += `
*Code Promo* : ${promoData.code} (${promoData.pourcentage}% de réduction)
*Prix Final* : ${price.toLocaleString('fr-FR')} ${planData.currency}`;
    } else {
        message += `
*Prix Final* : ${price.toLocaleString('fr-FR')} ${planData.currency}`;
    }

    message += `

---

*Informations Client*
*Email* : ${userData.email}
*UID* : ${userData.uid}
`;
    
    if (userData.referralCode) {
        message += `*Code de Parrainage Utilisé* : ${userData.referralCode}\n`;
    }

    message += `
---

*Paiement*
*Moyen de paiement choisi* : ${paymentMethod}

Merci de m'indiquer la procédure à suivre.`;

    return `https://wa.me/${supportPhoneNumber}?text=${encodeURIComponent(message)}`;
};

// Main message handler for stateful conversations
bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId || !userStates[userId]) return;

    const state = userStates[userId];
    const text = msg.text.trim();
    
    try {
        await bot.deleteMessage(chatId, msg.message_id);
        await bot.sendChatAction(chatId, 'typing');
        
        const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
        const userSnapshot = await getDocs(userQuery);
        
        let userDocRef;
        let userData;

        if (!userSnapshot.empty) {
            userDocRef = userSnapshot.docs[0].ref;
            userData = userSnapshot.docs[0].data();
            userData.uid = userSnapshot.docs[0].id;
        }

        let successMessage = '';
        let nextStep: UserState['step'] | null = null;
        let nextMessage: string | null = null;
        let nextKeyboard: any = null;

        switch (state.step) {
             case 'awaiting_linking_token':
                const userTokenQuery = query(collection(db, "users"), where("username", "==", text));
                const userTokenSnapshot = await getDocs(userTokenQuery);

                if (userTokenSnapshot.empty) {
                    await bot.sendMessage(chatId, `❌ Jeton invalide. Veuillez copier le jeton depuis votre profil sur le site.`, { parse_mode: 'Markdown' });
                } else {
                    const userToLinkDoc = userTokenSnapshot.docs[0];
                    await updateDoc(userToLinkDoc.ref, { telegramChatId: chatId });
                    await bot.sendMessage(chatId, `✅ *Compte Lié !*\n\nFélicitations, *${userToLinkDoc.data().username}* ! Votre compte est maintenant associé à ce chat.`, { parse_mode: 'Markdown' });
                    await sendStartMenu(chatId, "Que souhaitez-vous faire ?");
                }
                break;
            
            case 'awaiting_registration_email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
                    await bot.sendMessage(chatId, "❌ *Email Invalide*\nVeuillez entrer une adresse email valide.", { parse_mode: 'Markdown' });
                    return;
                }
                const emailQuery = query(collection(db, "users"), where("email", "==", text));
                const emailSnapshot = await getDocs(emailQuery);
                if (!emailSnapshot.empty) {
                    await bot.sendMessage(chatId, "❌ *Email Déjà Utilisé*\nCette adresse est déjà prise. Essayez de lier votre compte.", { parse_mode: 'Markdown' });
                    return;
                }
                state.data = { email: text };
                nextStep = 'awaiting_registration_password';
                nextMessage = "🔒 Entrez un mot de passe (8 caractères minimum).";
                break;

            case 'awaiting_registration_password':
                if (text.length < 8) {
                    await bot.sendMessage(chatId, "❌ *Mot de Passe Trop Court*\nLe mot de passe doit faire au moins 8 caractères.", { parse_mode: 'Markdown' });
                    return;
                }
                state.data.password = text;
                nextStep = 'awaiting_registration_confirm_password';
                nextMessage = "🔒 Confirmez votre mot de passe.";
                break;

            case 'awaiting_registration_confirm_password':
                 if (text !== state.data.password) {
                    await bot.sendMessage(chatId, "❌ *Mots de Passe Différents*\nVeuillez réessayer.", { parse_mode: 'Markdown' });
                    state.step = 'awaiting_registration_password';
                    await bot.sendMessage(chatId, "🔒 Entrez à nouveau votre mot de passe.");
                    return;
                }
                 try {
                    const userCredential = await createUserWithEmailAndPassword(auth, state.data.email, state.data.password);
                    await sendEmailVerification(userCredential.user);
                    
                    const batch = writeBatch(db);
                    const newUserDocRef = doc(db, "users", userCredential.user.uid);
                    batch.set(newUserDocRef, {
                        uid: userCredential.user.uid,
                        email: state.data.email,
                        username: state.data.email.split('@')[0] + Math.floor(Math.random()*100), // temp username
                        telegramChatId: chatId,
                        createdAt: serverTimestamp(),
                        isOnline: true,
                        solde_referral: 0,
                    });
                    
                    const pricingDocRef = doc(db, "users", userCredential.user.uid, "pricing", "jetpredict");
                    batch.set(pricingDocRef, { actif_jetpredict: false });

                    await batch.commit();

                    await bot.sendMessage(chatId, `✅ *Inscription Réussie !*\n\nUn email de vérification a été envoyé à ||${state.data.email}||\\.`, { parse_mode: 'MarkdownV2' });
                    await sendStartMenu(chatId, "Votre compte est maintenant lié. Pensez à vérifier votre email !");

                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        await bot.sendMessage(chatId, "❌ *Email Déjà Utilisé*", { parse_mode: 'Markdown' });
                    } else {
                        await bot.sendMessage(chatId, "❌ *Erreur Inconnue*\nLa création du compte a échoué.", { parse_mode: 'Markdown' });
                    }
                }
                break;
            
            case 'awaiting_change_password_current':
                if (!userData?.email) {
                    await bot.sendMessage(chatId, "❌ Erreur: Impossible de trouver votre email.");
                    return;
                }
                try {
                    await signInWithEmailAndPassword(auth, userData.email, text);
                    nextStep = 'awaiting_change_password_new';
                    nextMessage = "Entrez votre *nouveau* mot de passe (8 caractères minimum).";
                } catch (e) {
                    await bot.sendMessage(chatId, "❌ Mot de passe actuel incorrect. Veuillez réessayer.", { parse_mode: 'Markdown' });
                    return;
                }
                break;

            case 'awaiting_change_password_new':
                if (text.length < 8) {
                    await bot.sendMessage(chatId, "❌ Le nouveau mot de passe doit faire au moins 8 caractères.", { parse_mode: 'Markdown' });
                    return;
                }
                state.data = { newPassword: text };
                nextStep = 'awaiting_change_password_confirm';
                nextMessage = "Confirmez votre nouveau mot de passe.";
                break;

            case 'awaiting_change_password_confirm':
                 if (text !== state.data.newPassword) {
                    await bot.sendMessage(chatId, "❌ Les nouveaux mots de passe ne correspondent pas. Veuillez réessayer.", { parse_mode: 'Markdown' });
                    state.step = 'awaiting_change_password_new';
                    await bot.sendMessage(chatId, "Entrez à nouveau votre *nouveau* mot de passe.");
                    return;
                }
                if (auth.currentUser) {
                    await updatePassword(auth.currentUser, text);
                    successMessage = "Mot de passe changé avec succès !";
                }
                break;
            
             case 'awaiting_change_email_password':
                if (!userData?.email) {
                     await bot.sendMessage(chatId, "❌ Erreur: Impossible de trouver votre email.");
                     return;
                }
                try {
                    const credential = EmailAuthProvider.credential(userData.email, text);
                    if (auth.currentUser) {
                         await reauthenticateWithCredential(auth.currentUser, credential);
                         nextStep = 'awaiting_change_email_new';
                         nextMessage = "Entrez votre *nouvelle* adresse email.";
                    }
                } catch (e) {
                    await bot.sendMessage(chatId, "❌ Mot de passe incorrect. Veuillez réessayer.", { parse_mode: 'Markdown' });
                    return;
                }
                break;
            
            case 'awaiting_change_email_new':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
                     await bot.sendMessage(chatId, "❌ Adresse email invalide. Veuillez réessayer.", { parse_mode: 'Markdown' });
                     return;
                }
                 if (auth.currentUser && userDocRef) {
                    await updateEmail(auth.currentUser, text);
                    await updateDoc(userDocRef, { email: text });
                    await sendEmailVerification(auth.currentUser);
                    successMessage = `Email changé pour ||${text}||\\. Un email de vérification a été envoyé\\.`;
                }
                break;

            case 'awaiting_firstname':
                if (userDocRef) await updateDoc(userDocRef, { firstName: text });
                successMessage = `Prénom mis à jour : *${text}*`;
                break;
            case 'awaiting_lastname':
                if (userDocRef) await updateDoc(userDocRef, { lastName: text });
                successMessage = `Nom mis à jour : *${text}*`;
                break;
            case 'awaiting_username_edit':
                const existingUserQuery = query(collection(db, "users"), where("username", "==", text));
                const existingUserSnapshot = await getDocs(existingUserQuery);
                if (!existingUserSnapshot.empty) {
                    await bot.sendMessage(chatId, "❌ Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.", { parse_mode: 'Markdown' });
                    return;
                }
                if (userDocRef) await updateDoc(userDocRef, { username: text });
                successMessage = `Nom d'utilisateur mis à jour : *${text}*`;
                break;
            case 'awaiting_phone':
                if (userDocRef) await updateDoc(userDocRef, { phone: text });
                successMessage = `Téléphone mis à jour : *${text}*`;
                break;
            case 'awaiting_favorite_game':
                if (userDocRef) await updateDoc(userDocRef, { favoriteGame: text });
                successMessage = `Jeu préféré mis à jour : *${text}*`;
                break;
            case 'awaiting_pronostiqueur_code':
                 if (userDocRef) await updateDoc(userDocRef, { pronostiqueurCode: text });
                 successMessage = `Code pronostiqueur mis à jour.`;
                 break;
            
            case 'awaiting_history':
                const historyArray = text.replace(/x/g, "").split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
                if (historyArray.length === 0) {
                    await bot.sendMessage(chatId, "❌ *Données Invalides*\n\nVeuillez fournir un historique de crash valide (ex: `1.23 4.56 2.01`).", { parse_mode: 'Markdown' });
                    return;
                }

                const now = new Date();
                const userTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                const predictionInput: PredictCrashPointInput = {
                    userId: userSnapshot.docs[0].id,
                    gameName: 'Telegram Bot Game',
                    gameData: historyArray,
                    riskLevel: state.data.riskLevel,
                    gameState: 'From Telegram Bot',
                    userTime: userTime,
                };
                const result = await predictCrashPoint(predictionInput);
                
                if (result.predictions && result.predictions.length > 0) {
                    let responseText = `*Prédictions - ${state.data.riskLevel} (${new Date().toLocaleDateString('fr-FR')})*\n\n`;
                    responseText += '```\n';
                    responseText += `Heure  | Cote\n`;
                    responseText += `-------|--------\n`;
                    responseText += result.predictions.map(p => `${p.time} | ${p.predictedCrashPoint.toFixed(2)}x`).join('\n');
                    responseText += '\n```';
                    await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
                } else {
                    await bot.sendMessage(chatId, "🤖 L'IA n'a pas pu générer de prédictions pour le moment. Réessayez avec un historique différent.");
                }
                successMessage = 'Prédiction générée.'; // Pour effacer le state
                break;
            
            case 'awaiting_promo_code_input':
                const promoQuery = query(collection(db, "promo"), where("code", "==", text));
                const promoSnapshot = await getDocs(promoQuery);
                if (promoSnapshot.empty) {
                    await bot.sendMessage(chatId, "❌ Code promo invalide. Nous continuons sans réduction.");
                    state.data.promo = null;
                } else {
                    const promoData = { id: promoSnapshot.docs[0].id, ...promoSnapshot.docs[0].data() } as PromoCode;
                    const now = new Date();
                    const startDate = (promoData.debutdate as Timestamp).toDate();
                    const endDate = (promoData.findate as Timestamp).toDate();
                    
                    if (promoData.max > 0 && promoData.people && promoData.people.length >= promoData.max) {
                         await bot.sendMessage(chatId, "❌ La limite d'utilisation de ce code promo a été atteinte.");
                         state.data.promo = null;
                    } else if (now < startDate || now > endDate) {
                        await bot.sendMessage(chatId, "❌ Ce code promo est expiré.");
                        state.data.promo = null;
                    } else if (promoData.tous || promoData.plan === state.data.plan.period) {
                        const newPrice = state.data.price - (state.data.price * (promoData.pourcentage / 100));
                        state.data.price = newPrice;
                        state.data.promo = promoData;
                        await bot.sendMessage(chatId, `✅ *Code Appliqué !*\nNouveau prix : *${newPrice.toLocaleString('fr-FR')} ${state.data.plan.currency}*`, { parse_mode: 'Markdown'});
                    } else {
                        await bot.sendMessage(chatId, "❌ Ce code n'est pas valide for this plan.");
                        state.data.promo = null;
                    }
                }
                nextStep = 'awaiting_payment_method';
                nextMessage = "💵 Choisissez votre moyen de paiement :";
                nextKeyboard = { inline_keyboard: [paymentMethods.map(p => ({ text: p, callback_data: `payment_${p}` }))] };
                break;
        }

        if (nextStep && nextMessage) {
            userStates[userId].step = nextStep;
            await bot.sendMessage(chatId, nextMessage, { parse_mode: 'Markdown', reply_markup: nextKeyboard });
        } else if (successMessage) {
             if (state.step.startsWith('awaiting_') && !state.step.startsWith('awaiting_registration') && !state.step.startsWith('awaiting_change_email')) {
                 await bot.sendMessage(chatId, `✅ *Succès !*\n\n${successMessage}`, { parse_mode: 'Markdown' });
             } else if (state.step.startsWith('awaiting_change_email')) {
                await bot.sendMessage(chatId, `✅ *Succès !*\n\n${successMessage}`, { parse_mode: 'MarkdownV2' });
             }
            if (state.step.startsWith('awaiting_change')) {
                await sendStartMenu(chatId, "Que souhaitez-vous faire d'autre ?");
            } else if (state.step.startsWith('awaiting_') && !state.step.startsWith('awaiting_registration')) {
                 await sendProfileEditMenu(chatId);
            }
            delete userStates[userId];
        } else {
            delete userStates[userId];
        }
    
    } catch (error) {
        console.error("Error processing message:", error);
        await bot.sendMessage(chatId, "Une erreur est survenue. Veuillez réessayer.");
        delete userStates[userId];
    }
});


bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await sendStartMenu(chatId, "Je suis votre assistant pour les prédictions de jeux.");
});

bot.onText(/\/unlink/, async (msg) => {
    const chatId = msg.chat.id;
    
    const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        await bot.sendMessage(chatId, "Votre compte Telegram n'est actuellement lié à aucun compte JetPredict.");
        return;
    }

    const userDoc = userSnapshot.docs[0];
    try {
        await updateDoc(userDoc.ref, { telegramChatId: null });
        await bot.sendMessage(chatId, "Votre compte JetPredict a été délié de ce chat Telegram avec succès.");
        await sendStartMenu(chatId, "Vous pouvez maintenant lier un autre compte ou en créer un nouveau.");
    } catch (error) {
        console.error("Error unlinking account:", error);
        await bot.sendMessage(chatId, "Une erreur est survenue lors de la dissociation du compte. Veuillez réessayer.");
    }
});


bot.onText(/\/link (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match ? match[1] : null;

    if (!token) {
        await bot.sendMessage(chatId, "❌ Commande invalide. Utilisation : `/link VOTRE_JETON`", { parse_mode: 'Markdown' });
        return;
    }

    await bot.sendChatAction(chatId, 'typing');
    const userQuery = query(collection(db, "users"), where("telegramLinkToken", "==", token));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        await bot.sendMessage(chatId, "❌ Jeton de liaison invalide ou expiré. Veuillez en copier un nouveau depuis votre profil sur le site web.");
        return;
    }

    const userDoc = userSnapshot.docs[0];
    await updateDoc(userDoc.ref, { telegramChatId: chatId });

    await bot.sendMessage(chatId, `✅ *Compte Lié !* Félicitations, *${userDoc.data().username}* ! Votre compte est maintenant associé à ce chat.`, {parse_mode: 'Markdown'});
    await sendStartMenu(chatId, "Que souhaitez-vous faire ?");
});


bot.onText(/\/whatsapp/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `Rejoignez notre chaîne WhatsApp pour ne rien manquer !`, {
        reply_markup: {
            inline_keyboard: [[{ text: "📱 Ouvrir WhatsApp", url: whatsAppChannelUrl }]]
        }
    });
});

bot.onText(/\/telegram/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `Rejoignez notre canal Telegram pour les dernières actualités !`, {
        reply_markup: {
            inline_keyboard: [[{ text: "✈️ Ouvrir Telegram", url: telegramChannelUrl }]]
        }
    });
});

bot.onText(/\/jetgame/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        await bot.sendMessage(chatId, "🤫 Vous avez trouvé une commande secrète ! Pour l'utiliser, veuillez d'abord lier ou créer votre compte.", {
            reply_markup: {
                inline_keyboard: [[{ text: "🔗 Lier mon Compte", callback_data: 'link_account' }]]
            }
        });
        return;
    }
    await bot.sendGame(chatId, "JetGame");
});

bot.onText(/\/givemefreeplan/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        await bot.sendMessage(chatId, "🎁 Vous avez trouvé une commande secrète ! Pour réclamer votre cadeau, veuillez d'abord lier ou créer votre compte.", {
            reply_markup: {
                inline_keyboard: [[{ text: "🔗 Lier mon Compte", callback_data: 'link_account' }]]
            }
        });
        return;
    }

    const userDocRef = userSnapshot.docs[0].ref;
    const userData = userSnapshot.docs[0].data();

    if (userData.usedFreeTrial) {
        await bot.sendMessage(chatId, "Vous avez déjà utilisé votre essai gratuit. 😉");
        return;
    }

    const pricingDocRef = doc(db, "users", userDocRef.id, "pricing", "jetpredict");
    const pricingDoc = await getDoc(pricingDocRef);

    if (pricingDoc.exists() && pricingDoc.data().actif_jetpredict) {
        await bot.sendMessage(chatId, "Votre compte a déjà un forfait actif. Vous ne pouvez pas utiliser l'essai gratuit pour le moment.");
        return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour from now

    await updateDoc(pricingDocRef, {
        idplan_jetpredict: 'hourly',
        actif_jetpredict: true,
        startdate: Timestamp.fromDate(startDate),
        findate: Timestamp.fromDate(endDate),
    });

    await updateDoc(userDocRef, { usedFreeTrial: true });

    await bot.sendMessage(chatId, "🎉 *Félicitations !* 🎉\n\nVotre forfait d'essai gratuit d'une heure a été activé ! Vous pouvez maintenant utiliser la commande /predict avec le niveau de risque 'Faible'.", {parse_mode: 'Markdown'});
});

bot.onText(/\/whoami/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        await bot.sendMessage(chatId, "🤫 Commande secrète ! Pour l'utiliser, liez d'abord votre compte.", {
             reply_markup: { inline_keyboard: [[{ text: "🔗 Lier mon Compte", callback_data: 'link_account' }]] }
        });
        return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const pricingDocRef = doc(db, "users", userDoc.id, "pricing", "jetpredict");
    const pricingDoc = await getDoc(pricingDocRef);

    let planInfo = "Aucun forfait actif";
    if (pricingDoc.exists() && pricingDoc.data().actif_jetpredict) {
        const planData = pricingDoc.data();
        const planName = planData.idplan_jetpredict || 'N/A';
        const endDate = (planData.findate as Timestamp).toDate().toLocaleDateString('fr-FR');
        planInfo = `Forfait *${planName}* \\(expire le ${endDate}\\)`;
    }
    
    // MarkdownV2 requires escaping special characters.
    const escapedUsername = userData.username.replace(/([_*\[\]()~`>#+-=|{}.!])/g, '\\$1');
    const escapedEmail = userData.email.replace(/([_*\[\]()~`>#+-=|{}.!])/g, '\\$1');

    const response = `
👤 *PROFIL UTILISATEUR*
\`---------------------------\`
*Pseudo:* \`${escapedUsername}\`
*Email:* ||${escapedEmail}||
*Statut:* ${planInfo}
*UID:* ||${userDoc.id.replace(/([_*\[\]()~`>#+-=|{}.!])/g, '\\$1')}||
    `;
    await bot.sendMessage(chatId, response, { parse_mode: 'MarkdownV2' });
});

bot.onText(/\/matrix/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const matrixMessage = `
\`Wake up, Neo...
The Matrix has you...
Follow the white rabbit. 🐇

Initiating back-door protocol...
Injecting prediction sequence...
\`
*Jackpot imminent :* \`987.42x\`
    `;
    await bot.sendMessage(chatId, matrixMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/D3Officiel/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendChatAction(chatId, 'typing');
    const commandList = `
*👑 Panneau de Contrôle JetPredict 👑*
*Accès autorisé :* \`Administrateur\`

*MENU PUBLIC* 🌐
\`/start\`
_Lance l'interface principale et affiche les options._
\`/link [jeton]\`
_Synchronise votre compte JetPredict avec Telegram._
\`/whatsapp\`
_Accède à notre chaîne d'annonces WhatsApp._
\`/telegram\`
_Rejoint le canal de discussion et d'annonces Telegram._

*MODULES CACHÉS* ✨
\`/whoami\`
_Affiche un rapport d'identité de votre profil utilisateur._
\`/jetgame\`
_Déploie une instance de simulation du jeu de crash._
\`/givemefreeplan\`
_Active un accès temporaire d'une heure (usage unique)._
\`/matrix\`
_Tente d'exploiter une faille pour une cote... inhabituelle._
\`/D3Officiel\`
_Affiche ce panneau de contrôle des commandes._
    `;
    await bot.sendMessage(chatId, commandList, { parse_mode: 'Markdown' });
});


bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;

    if (callbackQuery.game_short_name) {
        if (callbackQuery.game_short_name === 'JetGame') {
            const gameUrl = `${appUrl}/simulation`;
            await bot.answerCallbackQuery({ callback_query_id: callbackQuery.id, url: gameUrl });
        } else {
             await bot.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: 'Désolé, ce jeu n\'est pas reconnu.', show_alert: true });
        }
        return;
    }

    if (!msg || !data) {
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    
    try {
        await bot.deleteMessage(chatId, msg.message_id);
        await bot.sendChatAction(chatId, 'typing');

        const userQuery = query(collection(db, "users"), where("telegramChatId", "==", chatId));
        const userSnapshot = await getDocs(userQuery);

        const handleUnlinkedUser = async () => {
            await bot.sendMessage(chatId, "*Compte Non Lié*\n\nPour continuer, veuillez lier votre compte JetPredict en utilisant votre jeton de liaison depuis la page de profil du site.", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🌐 Ouvrir le site pour copier le jeton', url: `${appUrl}/profile` }],
                        [{ text: 'J\'ai copié le jeton. Comment faire ?', callback_data: 'link_info' }]
                    ]
                }
            });
        };

        // Check if user is linked for protected actions
        if (!['link_account', 'link_info', 'create_account', 'back_to_main', 'buy_subscription'].includes(data) && !data.startsWith('buy_plan_') && !data.startsWith('promo_') && !data.startsWith('payment_')) {
            if (userSnapshot.empty) {
                await handleUnlinkedUser();
                return;
            }
        }
        
        switch (data) {
            case 'link_account':
                userStates[userId] = { step: 'awaiting_linking_token' };
                await bot.sendMessage(chatId, "🔑 Entrez votre jeton de liaison unique (votre pseudo) que vous trouverez sur votre profil web.");
                break;
                
            case 'create_account':
                userStates[userId] = { step: 'awaiting_registration_email' };
                await bot.sendMessage(chatId, "📧 Entrez votre adresse email pour commencer.");
                break;

            case 'play_game':
                if (userSnapshot.empty) {
                    await handleUnlinkedUser();
                    return;
                }
                await bot.sendGame(chatId, "JetGame");
                break;

            case 'predict':
                if (userSnapshot.empty) {
                    await handleUnlinkedUser();
                    return;
                }

                const userDoc = userSnapshot.docs[0];
                const pricingDocRef = doc(db, "users", userDoc.id, "pricing", "jetpredict");
                const pricingDoc = await getDoc(pricingDocRef);

                if (!pricingDoc.exists() || !pricingDoc.data().actif_jetpredict) {
                    await bot.sendMessage(chatId, '❌ *Abonnement Inactif*\n\nVeuillez souscrire à un forfait pour accéder aux prédictions.', { parse_mode: 'Markdown' });
                    return;
                }
                
                const expirationDate = pricingDoc.data().findate?.toDate();
                if (expirationDate && expirationDate < new Date()) {
                    await bot.sendMessage(chatId, '❌ *Abonnement Expiré*\n\nVeuillez renouveler votre forfait.', { parse_mode: 'Markdown' });
                    await updateDoc(pricingDocRef, { actif_jetpredict: false });
                    return;
                }

                const planId = pricingDoc.data().idplan_jetpredict as PlanId;
                const allowedRiskLevels = PLAN_RISK_LEVELS[planId] || [];

                if (allowedRiskLevels.length === 0) {
                    await bot.sendMessage(chatId, 'Aucun niveau de risque n\'est disponible pour votre forfait.');
                    return;
                }
                
                const keyboard = {
                    inline_keyboard: [
                        allowedRiskLevels.map(level => ({
                            text: `💥 ${level}`,
                            callback_data: `risk_${level}`
                        }))
                    ]
                };
                await bot.sendMessage(chatId, '📈 *Choisissez un Niveau de Risque*:', { reply_markup: keyboard, parse_mode: 'Markdown' });
                break;

            case 'edit_profile':
                await sendProfileEditMenu(chatId);
                break;

            case 'change_password':
                userStates[userId] = { step: 'awaiting_change_password_current' };
                await bot.sendMessage(chatId, "🔐 Pour votre sécurité, entrez votre mot de passe *actuel*.", { parse_mode: 'Markdown' });
                break;
                
            case 'change_email':
                userStates[userId] = { step: 'awaiting_change_email_password' };
                await bot.sendMessage(chatId, "🔐 Pour votre sécurité, entrez votre mot de passe.", { parse_mode: 'Markdown' });
                break;

            case 'edit_firstname':
                userStates[userId] = { step: 'awaiting_firstname' };
                await bot.sendMessage(chatId, "✏️ Entrez votre nouveau prénom :");
                break;
            case 'edit_lastname':
                userStates[userId] = { step: 'awaiting_lastname' };
                await bot.sendMessage(chatId, "✏️ Entrez votre nouveau nom :");
                break;
            case 'edit_username':
                userStates[userId] = { step: 'awaiting_username_edit' };
                await bot.sendMessage(chatId, "✏️ Entrez votre nouveau pseudo (doit être unique) :");
                break;
            case 'edit_phone':
                userStates[userId] = { step: 'awaiting_phone' };
                await bot.sendMessage(chatId, "✏️ Entrez votre nouveau numéro de téléphone :");
                break;
            case 'edit_favorite_game':
                userStates[userId] = { step: 'awaiting_favorite_game' };
                await bot.sendMessage(chatId, "✏️ Quel est votre nouveau jeu préféré ?");
                break;
            case 'edit_pronostiqueur_code':
                userStates[userId] = { step: 'awaiting_pronostiqueur_code' };
                await bot.sendMessage(chatId, "✏️ Entrez votre code pronostiqueur :");
                break;
            
            case 'back_to_main':
                await sendStartMenu(chatId, "Menu principal. Que souhaitez-vous faire ?");
                break;
            
            case 'buy_subscription':
                const userIsLinked = !userSnapshot.empty;
                if (!userIsLinked) {
                    await bot.sendMessage(chatId, "Pour acheter un forfait, vous devez d'abord lier ou créer un compte.", {
                        reply_markup: {
                            inline_keyboard: [[{ text: "🔗 Lier un compte", callback_data: 'link_account' }, { text: '📝 Créer un compte', callback_data: 'create_account' }]]
                        }
                    });
                    return;
                }

                const userDocForSub = userSnapshot.docs[0];
                const pricingDocRefForSub = doc(db, "users", userDocForSub.id, "pricing", "jetpredict");
                const pricingDocForSub = await getDoc(pricingDocRefForSub);

                if (pricingDocForSub.exists() && pricingDocForSub.data().actif_jetpredict) {
                    const planData = pricingDocForSub.data();
                    const planName = planData.idplan_jetpredict || 'N/A';
                    const endDate = planData.findate ? (planData.findate as Timestamp).toDate().toLocaleDateString('fr-FR') : 'N/A';
                    await bot.sendMessage(chatId, `💎 *Votre Abonnement*\n\nVous avez déjà un forfait *${planName}* actif jusqu'au *${endDate}*.`, {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'back_to_main' }]] }
                    });
                } else {
                    const plansColRef = collection(db, "applications", "VMrS6ltRDuKImzxAl3lR", "plans");
                    const q = query(plansColRef, orderBy("price", "asc"));
                    const plansSnapshot = await getDocs(q);
                    
                    if (plansSnapshot.empty) {
                        await bot.sendMessage(chatId, "Désolé, aucun forfait n'est disponible pour le moment.");
                        return;
                    }

                    const plansKeyboard = plansSnapshot.docs
                        .filter(doc => doc.data().period !== 'annual')
                        .map(doc => {
                            const planData = doc.data();
                            const price = planData.promoPrice ?? planData.price;
                            return {
                                text: `${planData.name} - ${price.toLocaleString('fr-FR')} ${planData.currency}`,
                                callback_data: `buy_plan_${planData.period}`
                            };
                        });
                    
                    await bot.sendMessage(chatId, "💎 *Nos Forfaits*\n\nChoisissez une option pour continuer :", {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [plansKeyboard, [{ text: '🔙 Retour', callback_data: 'back_to_main' }]]
                        }
                    });
                }
                break;

            case 'promo_oui':
                userStates[userId] = { step: 'awaiting_promo_code_input' };
                await bot.sendMessage(chatId, "✨ Entrez votre code promo :");
                break;

            case 'promo_non':
                 userStates[userId].step = 'awaiting_payment_method';
                 await bot.sendMessage(chatId, "💵 Choisissez votre moyen de paiement :", { 
                     reply_markup: { inline_keyboard: [paymentMethods.map(p => ({ text: p, callback_data: `payment_${p}` }))] }
                 });
                break;
                
            default:
                if (data.startsWith('risk_')) {
                    const riskLevel = data.replace('risk_', '');
                    userStates[userId] = { 
                        step: 'awaiting_history',
                        data: { riskLevel: riskLevel }
                    };
                    await bot.sendMessage(chatId, `*Niveau de Risque : ${riskLevel}*\n\n📊 Envoyez maintenant l'historique des derniers crashs, séparés par un espace.`, { parse_mode: 'Markdown' });
                } else if (data.startsWith('buy_plan_')) {
                    const planId = data.replace('buy_plan_', '');

                    if (userSnapshot.empty) {
                         await bot.sendMessage(chatId, "Vous devez d'abord créer ou lier un compte pour acheter un forfait.", { 
                             reply_markup: { inline_keyboard: [[{ text: '🔗 Lier mon compte', callback_data: 'link_account' }, {text: '📝 Créer un compte', callback_data: 'create_account'}]] }
                        });
                        return;
                    }

                    const plansColRef = collection(db, "applications", "VMrS6ltRDuKImzxAl3lR", "plans");
                    const planQuery = query(plansColRef, where("period", "==", planId));
                    const planSnapshot = await getDocs(planQuery);

                    if (planSnapshot.empty) {
                        await bot.sendMessage(chatId, "Désolé, ce forfait n'est plus disponible.");
                        return;
                    }
                    const planData = planSnapshot.docs[0].data();
                    const price = planData.promoPrice ?? planData.price;
                    
                    userStates[userId] = { 
                        step: 'awaiting_promo_code_decision',
                        data: { plan: planData, price: price }
                    };
                    
                    await bot.sendMessage(chatId, `*Forfait : ${planData.name}*\n\nAvez-vous un code promo ?`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Oui, j\'en ai un', callback_data: 'promo_oui' }, { text: 'Non, continuer', callback_data: 'promo_non' }]
                            ]
                        }
                    });

                } else if (data.startsWith('payment_')) {
                    const paymentMethod = data.replace('payment_', '');
                    const state = userStates[userId];
                    if (state && state.data && state.data.plan && userSnapshot.docs[0]) {
                        const userData = {uid: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data()}

                        if (state.data.promo) {
                            const promoDocRef = doc(db, "promo", state.data.promo.id);
                            await updateDoc(promoDocRef, {
                                people: arrayUnion(userData.uid)
                            });
                        }

                        const whatsappUrl = generateWhatsAppLink(chatId, state.data.plan, state.data.price, userData, paymentMethod, state.data.promo);
                        await bot.sendMessage(chatId, `*Finalisation via WhatsApp*\n\nPour payer le forfait *${state.data.plan.name}* via *${paymentMethod}*, veuillez cliquer sur le lien ci-dessous :`, {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[{ text: '✅ Finaliser sur WhatsApp', url: whatsappUrl }]]
                            }
                        });
                        delete userStates[userId];
                    }
                }
                break;
        }
    } catch (error) {
        console.error("Error in callback query handler:", error);
        // If editing failed, it might be because the message is old. Try sending a new one.
        try {
            await bot.sendMessage(chatId, "Une erreur est survenue, veuillez réessayer.");
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
    }
});
