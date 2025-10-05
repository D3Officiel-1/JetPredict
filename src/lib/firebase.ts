// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3AP0lZpB9yLBtEyJynDNU2kX25y5sc_8",
  authDomain: "predict-ci.firebaseapp.com",
  projectId: "predict-ci",
  storageBucket: "predict-ci.firebasestorage.app",
  messagingSenderId: "1052292566909",
  appId: "1:1052292566909:web:684445a972563b13144614",
  measurementId: "G-YDSN6BNJ5Y"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
      } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence.');
      }
    });
}


const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;

export const requestForToken = async (user: any) => {
  if (!messaging || !user) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging);
      if (currentToken) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { fcmToken: currentToken });
        console.log('FCM Token stored.');
        return currentToken;
      }
      return null;
    }
    return null;
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });


export { app, auth, db };
