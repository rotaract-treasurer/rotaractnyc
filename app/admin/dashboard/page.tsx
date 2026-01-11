'use client'

import Link from 'next/link'
import { useAdminSession } from '@/lib/admin/useAdminSession'

export default function AdminDashboard() {
  const session = useAdminSession()
  
  const stats = {
    members: 142,
    events: 8,
    posts: 28,
    fundsRaised: 12450,
  }

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session.status !== 'authenticated') {
    return null
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Breadcrumbs & Heading */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-primary">Home</Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="font-medium text-slate-900 dark:text-white">Dashboard</span>
            </nav>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back, Admin</h2>
            <p className="text-slate-500 dark:text-slate-400">Here is an overview of your club&apos;s performance.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.members}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">group</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +12 New
              </span>
              <span className="text-xs text-slate-400">this month</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.events}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <span className="material-symbols-outlined">assignment</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                Stable
              </span>
              <span className="text-xs text-slate-400">vs last quarter</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Funds Raised</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">${stats.fundsRaised.toLocaleString()}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +5%
              </span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Events Table & Activity Feed */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Events Column (2/3 width) */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Events</h3>
              <Link href="/admin/events" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold">Event Name</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Location</th>
                      <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                      <th scope="col" className="px-6 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">celebration</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">Annual Gala</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">Jan 25, 2026</td>
                      <td className="px-6 py-4 text-slate-500">The Plaza</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                          Published
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/admin/events" className="text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </Link>
                      </td>
                    </tr>
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-500">volunteer_activism</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">Community Service</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">Jan 28, 2026</td>
                      <td className="px-6 py-4 text-slate-500">Brooklyn Shelter</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                          Published
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/admin/events" className="text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </Link>
                      </td>
                    </tr>
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <span className="material-symbols-outlined">meeting_room</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">Board Meeting</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">Feb 01, 2026</td>
                      <td className="px-6 py-4 text-slate-500">Zoom</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                          Draft
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href="/admin/events" className="text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Activity Feed Column (1/3 width) */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-full max-h-[400px] overflow-y-auto">
              <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                {/* Feed Item 1 */}
                <div className="relative">
                  <span className="absolute -left-[23px] top-1 flex size-4 items-center justify-center rounded-full bg-primary ring-4 ring-white dark:ring-slate-900"></span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-semibold">Sarah J.</span> paid annual dues.
                    </p>
                    <span className="text-xs text-slate-500">2 mins ago</span>
                  </div>
                </div>

                {/* Feed Item 2 */}
                <div className="relative">
                  <span className="absolute -left-[23px] top-1 flex size-4 items-center justify-center rounded-full bg-slate-300 ring-4 ring-white dark:ring-slate-900 dark:bg-slate-700"></span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-900 dark:text-white">
                      New member application received from <span className="font-semibold">Mike R.</span>
                    </p>
                    <span className="text-xs text-slate-500">1 hour ago</span>
                  </div>
                </div>

                {/* Feed Item 3 */}
                <div className="relative">
                  <span className="absolute -left-[23px] top-1 flex size-4 items-center justify-center rounded-full bg-green-500 ring-4 ring-white dark:ring-slate-900"></span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-900 dark:text-white">
                      Event <span className="font-medium text-primary">Annual Gala</span> was published.
                    </p>
                    <span className="text-xs text-slate-500">5 hours ago</span>
                  </div>
                </div>

                {/* Feed Item 4 */}
                <div className="relative">
                  <span className="absolute -left-[23px] top-1 flex size-4 items-center justify-center rounded-full bg-slate-300 ring-4 ring-white dark:ring-slate-900 dark:bg-slate-700"></span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-900 dark:text-white">
                      Board meeting minutes uploaded.
                    </p>
                    <span className="text-xs text-slate-500">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
