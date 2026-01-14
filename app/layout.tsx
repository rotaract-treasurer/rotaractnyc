import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
    <html lang="en" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen pt-[var(--nav-height)]">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
