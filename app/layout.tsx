
import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-geist',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-geist-mono',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://deeni.tv'),
  title: {
    default: 'Deeni.tv - Your Spiritual TV Experience',
    template: '%s | Deeni.tv'
  },
  description: 'Experience premium spiritual content in a cinematic lean-back TV interface. Watch Islamic lectures, Ramadan guides, and more in a synchronized TV-like experience.',
  generator: 'Next.js',
  applicationName: 'Deeni.tv',
  referrer: 'origin-when-cross-origin',
  keywords: ['Islamic TV', 'Spiritual content', 'Ramadan guide', 'Islamic lectures', 'Dr. Abdullah Jahangir', 'Bengali lectures'],
  authors: [{ name: 'Deeni.tv Team' }],
  creator: 'Deeni.tv',
  publisher: 'Deeni.tv',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  icons: {
    icon: [
      { url: '/App_logo_192.jpg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/App_logo_256.jpg', sizes: '256x256', type: 'image/jpeg' },
      { url: '/App_logo_384.jpg', sizes: '384x384', type: 'image/jpeg' },
      { url: '/App_logo_512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/App_logo_192.jpg', sizes: '192x192', type: 'image/jpeg' },
    ],
    shortcut: '/App_logo_192.jpg',
  },

  manifest: '/manifest.json',
  
  openGraph: {
    title: 'Deeni.tv - Your Spiritual TV Experience',
    description: 'Experience premium spiritual content in a cinematic lean-back TV interface',
    url: 'https://deeni.tv',
    siteName: 'Deeni.tv',
    images: [
      {
        url: '/Deeni-TV-Cover-1200-630.jpg',
        width: 1200,
        height: 630,
        alt: 'Deeni.tv - Your Spiritual TV Experience',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Deeni.tv - Your Spiritual TV Experience',
    description: 'Experience premium spiritual content in a cinematic lean-back TV interface',
    images: ['/Deeni-TV-Cover-1200-630.jpg'],
    creator: '@deenitv',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  verification: {
    google: 'your-google-verification-code', // Add your verification code
    yandex: 'your-yandex-verification-code', // Add if needed
    yahoo: 'your-yahoo-verification-code', // Add if needed
  },
  
  category: 'religion',
  
  // PWA meta tags
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Deeni.tv',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Safari pinned-tab icon */}
        <link rel="mask-icon" href="/DeeniTV.svg" color="#16a34a" />

        {/* MS Application tile */}
        <meta name="msapplication-TileImage" content="/favicon-256x256.png" />
        <meta name="msapplication-TileColor" content="#16a34a" />

        {/* PWA Compatibility shim */}
        <script
          async
          src="https://cdn.jsdelivr.net/npm/pwacompat"
          crossOrigin="anonymous"
        />
      </head>
      <body 
        className="font-sans antialiased bg-zinc-950 text-white"
        suppressHydrationWarning={true}
      >
        <div id="root">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
