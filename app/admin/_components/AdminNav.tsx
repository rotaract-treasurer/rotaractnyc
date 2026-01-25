'use client';

import { useAdminSession } from '@/lib/admin/useAdminSession';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminNav() {
  const session = useAdminSession();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/members', label: 'Members' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/posts', label: 'Content' },
    { href: '/admin/gallery', label: 'Gallery' },
    { href: '/admin/service-hours', label: 'Service Hours' },
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
    <header className="nav-container">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-2">
                <Image
                  src="/Rotaract%20Logo%20(1).png"
                  alt="Rotaract NYC Admin Portal"
                  width={140}
                  height={36}
                  className="h-9 w-auto"
                  priority
                />
                <span className="hidden sm:inline text-xs font-semibold text-text-muted dark:text-text-muted-dark border-l border-border-light dark:border-border-dark pl-2 ml-1">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar (Centered) */}
          <div className="flex-1 max-w-md hidden md:flex">
            <label className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted dark:text-text-muted-dark">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input 
                className="input-search"
                placeholder="Search members, events, or content..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          {/* Navigation & Profile */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive ? 'nav-link-active py-5' : 'nav-link py-5'}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 pl-6 border-l border-border-light dark:border-border-dark">
              <Link
                href="/portal"
                className="btn-outline btn-sm"
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span className="hidden sm:inline ml-1">Portal</span>
              </Link>

              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-1 text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-primary-400 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full border-2 border-surface-light dark:border-zinc-950"></span>
              </button>

              {showNotifications ? (
                <div className="dropdown-menu right-4 top-16 w-72 p-3">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">Notifications</p>
                  <p className="mt-1 text-xs text-text-muted dark:text-text-muted-dark">No notifications yet.</p>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="btn-secondary btn-sm w-full mt-3"
                  >
                    Close
                  </button>
                </div>
              ) : null}
              
              <div className="relative group">
                <div className="avatar avatar-md border border-border-light dark:border-border-dark cursor-pointer bg-primary-100 dark:bg-primary-900/30">
                  <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-400">admin_panel_settings</span>
                </div>
                
                {/* Dropdown menu */}
                <div className="dropdown-menu right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3 border-b border-border-light dark:border-border-dark">
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Administrator</p>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">Admin Access</p>
                  </div>

                  <Link href="/admin/settings" className="dropdown-item">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="dropdown-item text-status-error border-t border-border-light dark:border-border-dark"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
