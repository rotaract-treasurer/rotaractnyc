'use client';

import Link from 'next/link';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Add Member',
    description: 'Register new club member',
    icon: 'person_add',
    href: '/admin/members',
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    title: 'Create Event',
    description: 'Schedule a new event',
    icon: 'event',
    href: '/admin/events',
    color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
  },
  {
    title: 'New Post',
    description: 'Publish content',
    icon: 'article',
    href: '/admin/posts',
    color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  },
  {
    title: 'Upload Photos',
    description: 'Add to gallery',
    icon: 'photo_library',
    href: '/admin/gallery',
    color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`flex items-start gap-3 p-4 rounded-lg border border-gray-100 dark:border-gray-800 transition-all ${action.color}`}
          >
            <div className="flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{action.title}</p>
              <p className="text-xs opacity-75">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
