'use client';

import { useAdminSession } from '@/lib/admin/useAdminSession';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const session = useAdminSession();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/members', label: 'Members', icon: 'group' },
    { href: '/admin/events', label: 'Events', icon: 'calendar_month' },
    { href: '/admin/posts', label: 'Content', icon: 'article' },
    { href: '/admin/gallery', label: 'Gallery', icon: 'photo_library' },
    { href: '/admin/messages', label: 'Messages', icon: 'mail' },
    { href: '/admin/pages', label: 'Pages', icon: 'description' },
  ];

  const settingsItems = [
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  const handleSignOut = async () => {
    try {
      const { adminSignOut } = await import('@/lib/admin/useAdminSession');
      await adminSignOut();
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col sticky top-8 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full justify-between bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-8">
          {/* Brand */}
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-2">
            <Image
              src="/Rotaract%20Logo%20(1).png"
              alt="Rotaract NYC Admin"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-col gap-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Menu
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px]`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Settings Section */}
          <nav className="flex flex-col gap-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              System
            </p>
            {settingsItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px]`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Info & Quick Actions */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Portal Link */}
          <Link
            href="/portal"
            className="flex items-center gap-3 px-4 py-3 mb-3 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">groups</span>
            <span className="text-sm font-medium">Member Portal</span>
          </Link>

          {/* Admin Info */}
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                Administrator
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Admin Access
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
