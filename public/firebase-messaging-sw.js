// This file must be in the public folder.

importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  apiKey: "AIzaSyB3AP0lZpB9yLBtEyJynDNU2kX25y5sc_8",
  authDomain: "predict-ci.firebaseapp.com",
  projectId: "predict-ci",
  storageBucket: "predict-ci.appspot.com",
  messagingSenderId: "1052292566909",
  appId: "1:1052292566909:web:684445a972563b13144614",
  measurementId: "G-YDSN6BNJ5Y"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});