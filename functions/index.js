
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.sendPredictionAlerts = functions.pubsub.schedule("every 1 minutes").onRun(async (context) => {
  const now = new Date();
  const nextMinuteStart = new Date(now.getTime() + 60 * 1000);
  const thirtySecondsFromNow = new Date(now.getTime() + 30 * 1000);
  const thirtyOneSecondsFromNow = new Date(now.getTime() + 31 * 1000);

  console.log(`[${now.toISOString()}] Running job. Checking for predictions in the next minute.`);

  try {
    const predictionsSnapshot = await db.collectionGroup("predictions").get();

    if (predictionsSnapshot.empty) {
      console.log("No predictions documents found.");
      return null;
    }

    const notificationPromises = [];

    for (const doc of predictionsSnapshot.docs) {
      const predictionData = doc.data();
      const userId = predictionData.userId;

      if (!userId || !predictionData.predictions || !Array.isArray(predictionData.predictions)) {
        continue;
      }
      
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists()) {
        console.log(`User ${userId} not found.`);
        continue;
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      const notificationSettings = userData.notificationSettings || {};
      
      if (notificationSettings.alertsEnabled === false) {
        console.log(`User ${userId} has disabled alerts.`);
        continue;
      }

      if (!fcmToken) {
        console.log(`FCM token not found for user ${userId}.`);
        continue;
      }

      for (const p of predictionData.predictions) {
        if (!p.time || typeof p.time !== 'string') continue;

        const [hours, minutes] = p.time.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;
        
        const today = new Date();
        const predictionTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
        
        if (predictionTime >= thirtySecondsFromNow && predictionTime < thirtyOneSecondsFromNow) {
          const message = {
            notification: {
              title: "🚀 Alerte Prédiction !",
              body: `La cote de ${p.predictedCrashPoint.toFixed(2)}x est prévue dans 30 secondes (${p.time}). Préparez-vous !`,
            },
            token: fcmToken,
            webpush: {
              notification: {
                icon: "https://i.postimg.cc/jS25XGKL/Capture-d-cran-2025-09-03-191656-4-removebg-preview.png",
                tag: `prediction-${p.time}`,
                renotify: true,
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          };

          console.log(`Sending notification to user ${userId} for prediction at ${p.time}`);
          notificationPromises.push(admin.messaging().send(message));
        }
      }
    }

    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
      console.log(`Successfully sent ${notificationPromises.length} notifications.`);
    } else {
      console.log("No notifications to send for this minute window.");
    }
    
    return null;
  } catch (error) {
    console.error("Error sending notifications:", error);
    return null;
  }
});
