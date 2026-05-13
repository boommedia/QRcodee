import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'QRcodee — Dynamic QR Code Generator',
    template: '%s | QRcodee',
  },
  description:
    'Create, customize, and track dynamic QR codes. Change destinations without reprinting. Scan analytics for every code. Bulk generation, API access, and white-label available.',
  keywords: [
    'QR code generator',
    'dynamic QR codes',
    'QR code analytics',
    'custom QR codes',
    'bulk QR codes',
    'white label QR',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://qrcodee.online'),
  openGraph: {
    title: 'QRcodee — Dynamic QR Code Generator',
    description:
      'Create, customize, and track dynamic QR codes. Change destinations without reprinting.',
    url: 'https://qrcodee.online',
    siteName: 'QRcodee',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QRcodee — Dynamic QR Code Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QRcodee — Dynamic QR Code Generator',
    description: 'Create, customize, and track dynamic QR codes.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
