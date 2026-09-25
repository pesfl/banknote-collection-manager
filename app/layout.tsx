import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Banknote Collection Manager',
  description: 'Specimen-level banknote collection management & AI multi-source valuation system',
  manifest: '/manifest.json',
  keywords: ['banknotes', 'numismatics', 'collection', 'valuation', 'specimen'],
  authors: [{ name: 'Banknote Collection Manager Team' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Banknote Collection Manager',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#1f2937',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950">{children}</body>
    </html>
  );
}
