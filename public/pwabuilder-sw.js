
// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = "pwabuilder-offline-page";
const OFFLINE_FALLBACK_PAGE = "/offline.html";

// PWA Builder - Manages the widgets in the service worker.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
importScripts('/widgets.js');

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(OFFLINE_FALLBACK_PAGE))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(OFFLINE_FALLBACK_PAGE);
        return cachedResp;
      }
    })());
  }
});

// --- Widget Templates ---

// Template for prediction_list widget
const prediction_list_template = `{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "Prochaines Prédictions",
      "weight": "bolder",
      "size": "medium"
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "FactSet",
          "facts": [
            {
              "$data": "\${predictions}",
              "title": "\${time}",
              "value": "\${predictedCrashPoint}x"
            }
          ]
        }
      ]
    }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5"
}`;

// Template for next_prediction_card widget
const next_prediction_card_template = `{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "Prochaine Prédiction",
      "weight": "bolder",
      "size": "medium",
      "horizontalAlignment": "center"
    },
    {
      "type": "TextBlock",
      "text": "\${nextPrediction.time}",
      "size": "large",
      "horizontalAlignment": "center"
    },
    {
      "type": "TextBlock",
      "text": "\${nextPrediction.predictedCrashPoint}x",
      "size": "extraLarge",
      "weight": "bolder",
      "color": "accent",
      "horizontalAlignment": "center"
    }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5"
}`;

// Template for predictions_summary widget
const predictions_summary_template = `{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "Résumé",
      "weight": "bolder",
      "size": "medium"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Prédictions totales :",
          "value": "\${summary.totalCount}"
        },
        {
          "title": "Cote Max :",
          "value": "\${summary.maxCrashPoint}x"
        }
      ]
    }
  ],
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5"
}`;


// --- Widget Data Handlers ---

// Mock data, in a real scenario you would fetch this from a server or IndexedDB
const mockPredictions = {
    predictions: [
        { time: "14:30", predictedCrashPoint: "2.15" },
        { time: "14:38", predictedCrashPoint: "1.89" },
        { time: "14:45", predictedCrashPoint: "3.50" }
    ]
};

async function getPredictionData() {
    // In a real app, you would fetch fresh data.
    // For this example, we'll use mock data.
    const nextPrediction = mockPredictions.predictions.length > 0 ? mockPredictions.predictions[0] : { time: "N/A", predictedCrashPoint: "N/A" };
    const summary = {
      totalCount: mockPredictions.predictions.length,
      maxCrashPoint: mockPredictions.predictions.reduce((max, p) => Math.max(max, parseFloat(p.predictedCrashPoint)), 0).toFixed(2)
    };
    return {
      predictions: mockPredictions.predictions,
      nextPrediction: nextPrediction,
      summary: summary
    };
}


// --- Widget Event Listeners ---

self.addEventListener("widgetinstall", event => {
    console.log("Widget installed", event);
    event.waitUntil(renderWidget(event));
});

self.addEventListener("widgetuninstall", event => {
    console.log("Widget uninstalled", event);
});

self.addEventListener("widgetclick", event => {
    if (event.action === "open-app") {
        console.log("Widget clicked to open app");
        // This is the default action, we don't need to do anything.
    }
});


async function renderWidget(event) {
    const data = await getPredictionData();
    let template;

    switch (event.widget.definition.tag) {
        case "prediction_list":
            template = prediction_list_template;
            break;
        case "next_prediction_card":
            template = next_prediction_card_template;
            break;
        case "predictions_summary":
            template = predictions_summary_template;
            break;
        default:
            console.error("Unknown widget tag:", event.widget.definition.tag);
            return;
    }

    await self.widgets.updateByTag(event.widget.definition.tag, {
        template: template,
        data: JSON.stringify(data)
    });
}

    