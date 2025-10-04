import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jet Predict',
    short_name: 'Jet Predict',
    description: 'Prédiction de côte pour les jeux de crash et paris sportifs.',
    start_url: '/splash',
    display: 'standalone',
    background_color: '#0c1023',
    theme_color: '#0c1023',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    "file_handlers": [
      {
        "action": "/open-file",
        "accept": {
          "text/*": [".txt", ".md"]
        }
      }
    ],
    "protocol_handlers": [
      {
        "protocol": "web+jetpredict",
        "url": "/protocol?url=%s"
      }
    ],
     "share_target": {
      "action": "/share",
      "params": {
        "title": "title",
        "text": "text",
        "url": "url"
      }
    }
  };
}
