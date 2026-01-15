'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function RouteChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute ? <Navbar /> : null}
      <main className={isAdminRoute ? 'min-h-screen' : 'min-h-screen pt-[var(--nav-height)]'}>
        {children}
      </main>
    </>
  )
}
