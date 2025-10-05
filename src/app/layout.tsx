
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jet-predict.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Jet Predict',
  description: 'Prédiction de côte',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jet Predict',
  },
  openGraph: {
    title: 'Jet Predict - Prédiction de côte',
    description: 'Maximisez vos gains avec des analyses de paris basées sur les données. Obtenez des prédictions de cotes fiables pour les jeux de crash et les paris sportifs.',
    url: APP_URL,
    siteName: 'Jet Predict',
    images: [
      {
        url: 'https://i.postimg.cc/XYRCXyF9/Jet-Predict.jpg',
        width: 1200,
        height: 630,
        alt: 'Tableau de bord Jet Predict',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jet Predict - Prédiction de côte',
    description: 'Maximisez vos gains avec des analyses de paris basées sur les données. Obtenez des prédictions de cotes fiables pour les jeux de crash et les paris sportifs.',
    images: ['https://i.postimg.cc/XYRCXyF9/Jet-Predict.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#121832',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
        <meta name="application-name" content="Jet Predict" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jet Predict" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#121832" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
