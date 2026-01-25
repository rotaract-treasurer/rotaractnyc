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
      <div className="page-bg-alt font-display flex items-center justify-center antialiased text-text-primary dark:text-text-primary-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted dark:text-text-muted-dark">Loading…</p>
        </div>
      </div>
    )
  }

  if (session.status !== 'authenticated') {
    return (
      <div className="page-bg-alt font-display flex items-center justify-center antialiased text-text-primary dark:text-text-primary-dark px-6">
        <div className="card w-full max-w-lg p-6">
          <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Sign in required</h1>
          <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">
            Please sign in to access the admin panel.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => (window.location.href = '/admin/login')}
              className="btn-primary"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg-alt font-display antialiased text-text-primary dark:text-text-primary-dark">
      <AdminNav />
      <main className="container-main py-8">
        {children}
      </main>
    </div>
  )
}
