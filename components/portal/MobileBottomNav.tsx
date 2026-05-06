'use client';

/**
 * MobileBottomNav — iOS/Android-style bottom tab bar for the member portal.
 *
 * Visible only on screens narrower than `lg` (the desktop sidebar replaces it
 * at that breakpoint). The tab list is intentionally short — picking the five
 * most-used member surfaces — with a `More` slot that opens the existing
 * sidebar drawer for everything else.
 *
 * Tabs accept an optional `badge` (unread count) and a `tutorialId` for the
 * tutorial overlay.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface Tab {
  label: string;
  href: string;
  /** Match logic — defaults to startsWith(href). For `/portal` use exact match. */
  match?: 'exact' | 'prefix';
  icon: React.ReactNode;
  iconActive?: React.ReactNode;
  badge?: number;
}

interface Props {
  unreadMessages?: number;
  unreadAnnouncements?: number;
  /** Called when the user taps the `More` tab — opens the existing sidebar drawer. */
  onOpenMore: () => void;
}

export default function MobileBottomNav({
  unreadMessages = 0,
  unreadAnnouncements = 0,
  onOpenMore,
}: Props) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      label: 'Home',
      href: '/portal',
      match: 'exact',
      icon: (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L12 2.25 21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: 'Events',
      href: '/portal/events',
      icon: (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      href: '/portal/messages',
      badge: unreadMessages,
      icon: (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      label: 'Hours',
      href: '/portal/service-hours',
      icon: (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (tab: Tab) =>
    tab.match === 'exact' ? pathname === tab.href : pathname.startsWith(tab.href);

  return (
    <nav
      aria-label="Portal bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 pb-safe shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0',
                active
                  ? 'text-cranberry dark:text-cranberry-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 ? (
                  <span
                    aria-label={`${tab.badge} unread`}
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-cranberry text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium leading-none truncate max-w-full px-1">
                {tab.label}
              </span>
              {active && (
                <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-cranberry" />
              )}
            </Link>
          );
        })}

        {/* More — opens sidebar drawer */}
        <button
          type="button"
          onClick={onOpenMore}
          className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-w-0"
          aria-label="Open more navigation options"
        >
          <div className="relative">
            <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            {unreadAnnouncements > 0 && (
              <span
                aria-label={`${unreadAnnouncements} new announcements`}
                className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-cranberry text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
              >
                {unreadAnnouncements > 99 ? '99+' : unreadAnnouncements}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
