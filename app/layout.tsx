import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import RouteChrome from '@/components/RouteChrome'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta' 
})

export const metadata: Metadata = {
  title: 'Rotaract Club at the United Nations',
  description: 'Rotaract Club of New York at the United Nations - Service, Fellowship, Diversity',
  keywords: ['rotaract', 'united nations', 'new york', 'service club', 'volunteer', 'leadership'],
  openGraph: {
    title: 'Rotaract Club at the United Nations',
    description: 'Rotaract Club of New York at the United Nations',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <RouteChrome>{children}</RouteChrome>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
