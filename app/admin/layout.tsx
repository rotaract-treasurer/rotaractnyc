'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminSession, adminSignOut } from '@/lib/admin/useAdminSession'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const session = useAdminSession()

  // Don't show layout on login page
  if (pathname === '/admin/login' || pathname === '/admin') {
    return children
  }

  const menuItems = [
    { name: 'Overview', icon: 'dashboard', href: '/admin/dashboard' },
    { name: 'Members', icon: 'group', href: '/admin/members' },
    { name: 'Events', icon: 'calendar_month', href: '/admin/events' },
    { name: 'Content', icon: 'article', href: '/admin/posts' },
    { name: 'Gallery', icon: 'photo_library', href: '/admin/gallery' },
    { name: 'Messages', icon: 'mail', href: '/admin/messages' },
    { name: 'Pages', icon: 'description', href: '/admin/pages' },
  ]

  const systemItems = [
    { name: 'Settings', icon: 'settings', href: '/admin/settings' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex z-20">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA47T-9wtH_QLu-t8jylVBtYz7rutjBjEW5pNqMLoTHWEkonmpCamXlIJ0EyVM5aSyGOJY3HdgvReEU4JFrDR1MadpWPqh5UJRMfd3ssoE4GjNHiZlwCU6iJM9D9BHqb1_VOjDxoExENuM1jPem6H9yKPyo54TKQXmQVxhWaa0gmpsHMNHToVEKZk-mYlnnZIWEl9YZOAp7RLqwJ1JDSQrGywQVfQgBSLwMkLcHY7_oytTCZv_w3hf8mlPfS153X3J8QSrRjIU30-o" 
              alt="Rotaract Club Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Rotaract NYC</h1>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <nav className="flex flex-col gap-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Menu</p>
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2 mt-8">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">System</p>
            {systemItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 p-3">
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold">
                {session.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {session.email || 'Admin'}
                </span>
                <span className="truncate text-xs text-slate-500">Administrator</span>
              </div>
              <button
                onClick={async () => {
                  await adminSignOut()
                  router.push('/')
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 lg:hidden">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-bold text-lg lg:hidden">Rotaract NYC</span>
          </div>

          {/* Search */}
          <div className="hidden max-w-md flex-1 lg:flex">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
              <input
                className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                placeholder="Search members, events..."
                type="text"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="relative flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:text-slate-400">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-500 border border-white dark:border-slate-900"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
            <Link
              href="/"
              className="hidden lg:flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">public</span>
              View Site
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
