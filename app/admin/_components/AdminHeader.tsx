'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminSignOut } from '@/lib/admin/useAdminSession'

export default function AdminHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const router = useRouter()

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{title}</h1>
            {subtitle ? <p className="text-gray-600 mt-1">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-primary/30 text-primary rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await adminSignOut()
                router.push('/')
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
