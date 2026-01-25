'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { ReactNode } from 'react'

interface RouteChromeProps {
  children: ReactNode
  footer?: ReactNode
}

export default function RouteChrome({ children, footer }: RouteChromeProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin')
  const isPortalRoute = pathname.startsWith('/portal')
  const isInternalRoute = isAdminRoute || isPortalRoute

  return (
    <>
      {!isInternalRoute && <Navbar />}
      <main 
        id="main-content"
        className={isInternalRoute ? 'min-h-screen' : 'min-h-screen pt-[var(--nav-height)]'}
      >
        {children}
      </main>
      {!isInternalRoute && footer}
    </>
  )
}
