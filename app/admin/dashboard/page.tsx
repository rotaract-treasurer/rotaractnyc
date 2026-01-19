'use client'

import Link from 'next/link'
import { useAdminSession } from '@/lib/admin/useAdminSession'
import StatCard from '../_components/StatCard'
import RecentActivity from '../_components/RecentActivity'
import QuickActions from '../_components/QuickActions'

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
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, Admin
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Here&apos;s what&apos;s happening with your club today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Members"
          value={stats.members}
          icon="group"
          iconColor="bg-primary/10 text-primary"
          trend={{ value: '+12 New', positive: true }}
          subtitle="this month"
        />
        <StatCard
          title="Active Events"
          value={stats.events}
          icon="calendar_month"
          iconColor="bg-purple-500/10 text-purple-500"
          trend={{ value: 'Stable', neutral: true }}
          subtitle="vs last quarter"
        />
        <StatCard
          title="Published Posts"
          value={stats.posts}
          icon="article"
          iconColor="bg-green-500/10 text-green-600"
          trend={{ value: '+5', positive: true }}
          subtitle="this week"
        />
        <StatCard
          title="Funds Raised"
          value={`$${stats.fundsRaised.toLocaleString()}`}
          icon="attach_money"
          iconColor="bg-orange-500/10 text-orange-600"
          trend={{ value: '+5%', positive: true }}
          subtitle="vs last month"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions + Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Upcoming Events */}
          <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Events scheduled in the next 30 days
                </p>
              </div>
              <Link
                href="/admin/events"
                className="text-sm font-medium text-primary hover:text-blue-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <EventRow
                title="Annual Gala"
                date="Jan 25, 2026"
                location="The Plaza"
                status="published"
              />
              <EventRow
                title="Community Cleanup"
                date="Feb 5, 2026"
                location="Central Park"
                status="draft"
              />
              <EventRow
                title="Fundraising Dinner"
                date="Feb 15, 2026"
                location="Hudson Yards"
                status="published"
              />
            </div>
          </div>

          {/* Recent Members */}
          <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Members</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Latest member registrations
                </p>
              </div>
              <Link
                href="/admin/members"
                className="text-sm font-medium text-primary hover:text-blue-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <MemberRow
                name="John Smith"
                email="john@example.com"
                status="active"
                joined="2 days ago"
              />
              <MemberRow
                name="Sarah Johnson"
                email="sarah@example.com"
                status="pending"
                joined="5 days ago"
              />
              <MemberRow
                name="Mike Chen"
                email="mike@example.com"
                status="active"
                joined="1 week ago"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </main>
  )
}

function EventRow({
  title,
  date,
  location,
  status,
}: {
  title: string
  date: string
  location: string
  status: 'published' | 'draft'
}) {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-600 text-[20px]">event</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {date} • {location}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            status === 'published'
              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10'
              : 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-700/10'
          }`}
        >
          {status === 'published' ? '✓ Published' : '○ Draft'}
        </span>
      </div>
    </div>
  )
}

function MemberRow({
  name,
  email,
  status,
  joined,
}: {
  name: string
  email: string
  status: 'active' | 'pending'
  joined: string
}) {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">person</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              status === 'active'
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            {status === 'active' ? '✓ Active' : '○ Pending'}
          </span>
          <p className="text-xs text-gray-400 mt-1">{joined}</p>
        </div>
      </div>
    </div>
  )
}
