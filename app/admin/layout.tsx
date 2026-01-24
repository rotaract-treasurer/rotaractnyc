'use client'

import { usePathname } from 'next/navigation'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import { AuthProvider } from '@/lib/firebase/auth'
import { useEffect } from 'react'
import AdminNav from './_components/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const session = useAdminSession()
  const isLoginPage = pathname === '/admin/login'
  const isRootPage = pathname === '/admin'

  // Don't show layout on login or root page
  if (isLoginPage || isRootPage) {
    return children
  }

  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useAdminSession()

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      window.location.href = '/admin/login'
    }
  }, [session.status])

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display flex items-center justify-center antialiased text-slate-900 dark:text-white relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        <p className="relative text-sm text-slate-600 dark:text-slate-400">Loading…</p>
      </div>
    )
  }

  if (session.status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display flex items-center justify-center antialiased text-slate-900 dark:text-white px-6 relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 shadow-sm">
          <h1 className="text-xl font-bold">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please sign in to access the admin panel.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => (window.location.href = '/admin/login')}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display antialiased text-slate-900 dark:text-white relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <div className="relative">
        <AdminNav />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
