'use client';

import { useAuth } from '@/lib/firebase/auth';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { canManageFinances, isAdmin, canManagePosts } from '@/lib/portal/roles';
import NewPostModal from './NewPostModal';

export default function PortalNav() {
  const { user, userData, signOut } = useAuth();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const showAdminLink = isAdmin(userData?.role);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const canCreatePosts = canManagePosts(userData?.role);

  const navItems = [
    { href: '/portal/announcements', label: 'Feed' },
    { href: '/portal/events', label: 'Calendar' },
    { href: '/portal/directory', label: 'Directory' },
    { href: '/portal/posts', label: 'Articles' },
    { href: '/portal/docs', label: 'Resources' },
  ];

  // Add Finance tab if user has treasurer+ role
  if (canManageFinances(userData?.role)) {
    navItems.push({ href: '/portal/finance', label: 'Finance' });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/portal/login';
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
            <Link href="/portal">
              <div className="flex items-center">
                <Image
                  src="/Rotaract%20Logo%20(1).png"
                  alt="Rotaract NYC Member Portal"
                  width={140}
                  height={36}
                  className="h-9 w-auto"
                  priority
                />
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
                placeholder="Search announcements, members, or events..."
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
                const isActive = pathname === item.href || 
                  (item.href === '/portal/announcements' && pathname === '/portal') ||
                  (item.href === '/portal/posts' && pathname?.startsWith('/portal/posts'));
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
              {canCreatePosts && (
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="btn-blue btn-sm shadow-lg shadow-blue-900/20"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="hidden sm:inline ml-1">New Post</span>
                </button>
              )}
              
              {showAdminLink ? (
                <Link
                  href="/admin"
                  className="btn-outline btn-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span className="hidden sm:inline ml-1">Admin</span>
                </Link>
              ) : null}

              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-1 text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-primary-400 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full border-2 border-surface-light dark:border-surface-dark-secondary"></span>
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
                <div 
                  className="avatar avatar-md border border-border-light dark:border-border-dark cursor-pointer"
                  style={user?.photoURL ? { backgroundImage: `url(${user.photoURL})`, backgroundSize: 'cover' } : {}}
                >
                  {!user?.photoURL && (
                    <span className="material-symbols-outlined text-[18px] text-text-muted">person</span>
                  )}
                </div>
                
                {/* Dropdown menu */}
                <div className="dropdown-menu right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3 border-b border-border-light dark:border-border-dark">
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{userData?.name || user?.displayName}</p>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">{userData?.role || 'Member'}</p>
                  </div>

                  <Link href="/portal/settings" className="dropdown-item">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </Link>

                  {isAdmin(userData?.role) ? (
                    <Link href="/admin" className="dropdown-item">
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                      Admin
                    </Link>
                  ) : null}

                  <button onClick={handleSignOut} className="dropdown-item">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* New Post Modal */}
      <NewPostModal isOpen={showNewPostModal} onClose={() => setShowNewPostModal(false)} />
    </header>
  );
}
