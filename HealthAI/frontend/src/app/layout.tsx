import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HEALTH-AI · ML Learning Tool | Erasmus+ KA220-HED',
  description:
    'An interactive machine learning education platform for healthcare professionals. Build, train, and evaluate clinical AI models across 20 medical specialties.',
  keywords: [
    'healthcare AI',
    'machine learning',
    'medical education',
    'clinical decision support',
    'Erasmus+',
    'KA220-HED',
  ],
  authors: [{ name: 'HEALTH-AI Erasmus+ Consortium' }],
  openGraph: {
    title: 'HEALTH-AI · ML Learning Tool',
    description:
      'Interactive ML education for healthcare professionals — 20 clinical specialties, 6 ML algorithms, full explainability and ethics toolkit.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable}`}
      suppressHydrationWarning
    >
      <body className={`${inter.className} antialiased bg-surface min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
