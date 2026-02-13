'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Link from 'next/link';

// Quick action items for the dashboard
const quickActions = [
  { label: 'Log Service Hours', href: '/portal/service-hours', icon: '⏱️' },
  { label: 'View Events', href: '/portal/events', icon: '📅' },
  { label: 'Member Directory', href: '/portal/directory', icon: '👥' },
  { label: 'Pay Dues', href: '/portal/dues', icon: '💳' },
];

export default function PortalDashboard() {
  const { member } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [postContent, setPostContent] = useState('');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Welcome back, {member?.firstName || member?.displayName?.split(' ')[0] || 'Member'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s what&apos;s happening in your community.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Composer */}
          <Card padding="md">
            <div className="flex gap-3">
              <Avatar src={member?.photoURL} alt={member?.displayName || ''} size="md" />
              <div className="flex-1">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share something with the community..."
                  className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 border border-gray-200 dark:border-gray-700 resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg text-gray-400 hover:text-cranberry hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Add image">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-lg text-gray-400 hover:text-cranberry hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Add link">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  </div>
                  <Button size="sm" disabled={!postContent.trim()}>Post</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Feed Tabs */}
          <Tabs
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'community', label: 'Community' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* Sample Feed Items */}
          <Card padding="md">
            <div className="flex items-start gap-3">
              <Avatar alt="Sarah Chen" size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Sarah Chen</p>
                  <Badge variant="cranberry">President</Badge>
                  <span className="text-xs text-gray-400">2h ago</span>
                </div>
                <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  🎉 Exciting news! Our Spring Service Day is confirmed for March 15th. We&apos;ll be cleaning up Central Park together! Sign up in the Events section. Let&apos;s make it our biggest turnout yet!
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-cranberry transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    12
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-cranberry transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    3
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-start gap-3">
              <Avatar alt="Michael Torres" size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Michael Torres</p>
                  <span className="text-xs text-gray-400">5h ago</span>
                </div>
                <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  Just submitted my service hours for the food bank volunteering last Saturday. It was such an incredible experience! If you haven&apos;t logged your hours yet, don&apos;t forget to do so. 📝
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-cranberry transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    8
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-cranberry transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    1
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card padding="md">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-cranberry-50 dark:hover:bg-cranberry-900/10 hover:text-cranberry transition-colors text-center"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
              <Link href="/portal/events" className="text-xs text-cranberry hover:text-cranberry-800 font-medium">View all</Link>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="text-center bg-cranberry-50 dark:bg-cranberry-900/20 rounded-lg px-2.5 py-1.5 shrink-0">
                  <p className="text-xs text-cranberry font-bold">FEB</p>
                  <p className="text-lg font-bold text-cranberry-800 dark:text-cranberry-300">26</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Monthly General Meeting</p>
                  <p className="text-xs text-gray-500">7:00 PM · 216 E 45th St</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="text-center bg-cranberry-50 dark:bg-cranberry-900/20 rounded-lg px-2.5 py-1.5 shrink-0">
                  <p className="text-xs text-cranberry font-bold">MAR</p>
                  <p className="text-lg font-bold text-cranberry-800 dark:text-cranberry-300">13</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Rotaract Day of Unity</p>
                  <p className="text-xs text-gray-500">10:00 AM · Multiple Locations</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Member Spotlight */}
          <Card padding="md">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Member Spotlight ⭐</h3>
            <div className="text-center">
              <Avatar alt="Emily Washington" size="lg" className="mx-auto" />
              <p className="mt-3 font-semibold text-gray-900 dark:text-white">Emily Washington</p>
              <p className="text-xs text-gray-500">Service Chair</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Led 12 service projects this year with 200+ volunteer hours!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
