import type { Metadata } from 'next';
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://azudigitalstudio.com'),
  title: {
    default: 'Azu Digital Studio',
    template: '%s | Azu Digital Studio',
  },
  description: 'Social media management, video editing and web development for entrepreneurs — in English, Spanish & Portuguese.',
  keywords: ['digital marketing', 'social media management', 'video editing', 'web development', 'instagram', 'tiktok', 'youtube'],
  authors: [{ name: 'Azu Digital Studio' }],
  creator: 'Azu Digital Studio',
  openGraph: {
    type: 'website',
    siteName: 'Azu Digital Studio',
    title: 'Azu Digital Studio — Your brand, amplified.',
    description: 'Social media management, video editing and web development for entrepreneurs — in English, Spanish & Portuguese.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Azu Digital Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Azu Digital Studio — Your brand, amplified.',
    description: 'Social media management, video editing and web development for entrepreneurs.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${cormorantGaramond.variable} ${instrumentSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
