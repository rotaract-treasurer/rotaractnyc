'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAdminSession } from '@/lib/admin/useAdminSession'

export default function AdminPage() {
  const session = useAdminSession()
  const router = useRouter()

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (session.status === 'authenticated') {
      router.push('/admin/dashboard')
    }
  }, [session.status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <div className="relative text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
