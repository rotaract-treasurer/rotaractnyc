'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/firebase/auth';
import PortalShell from '@/components/portal/PortalShell';

// Pages that render their own chrome (no sidebar / auth gate)
const SHELL_EXCLUDED = ['/portal/login', '/portal/onboarding', '/portal/onboarding/success'];

// Map pathname prefixes to human-readable tab titles
const PORTAL_TITLES: [string, string][] = [
  ['/portal/events', 'Events'],
  ['/portal/messages', 'Messages'],
  ['/portal/announcements', 'Announcements'],
  ['/portal/committees', 'Committees'],
  ['/portal/gallery', 'Gallery'],
  ['/portal/service-hours/analytics', 'Service Analytics'],
  ['/portal/service-hours', 'Service Hours'],
  ['/portal/dues', 'Dues & Billing'],
  ['/portal/profile', 'My Profile'],
  ['/portal/settings', 'Settings'],
  ['/portal/articles', 'Articles'],
  ['/portal/documents', 'Documents'],
  ['/portal/directory', 'Directory'],
  ['/portal/finance', 'Finance'],
  ['/portal/admin', 'Admin'],
  ['/portal/board', 'Board'],
  ['/portal/forms', 'Forms'],
  ['/portal/media', 'Media'],
  ['/portal', 'Dashboard'],
];

// Inner component that has access to auth context
function PortalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member } = useAuth();
  const skipShell = SHELL_EXCLUDED.some((p) => pathname === p);

  const isAdminOrBoard = member?.role === 'board' || member?.role === 'president' || member?.role === 'treasurer';

  // Swap the web app manifest based on context:
  //   - Board / Admin   → /admin-manifest.json (event scanning, broadcasts, etc.)
  //   - Active member   → /member-manifest.json (events, messages, hours, dues)
  //   - Public / pre-auth → fall back to the public /manifest.json
  useEffect(() => {
    const manifestHref = isAdminOrBoard
      ? '/admin-manifest.json'
      : member
        ? '/member-manifest.json'
        : '/manifest.json';
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;
    // Keep the theme-color meta in sync so the install card uses the cranberry brand.
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = '#9B1B30';
  }, [isAdminOrBoard, member]);

  // Update document.title on route change
  useEffect(() => {
    const match = PORTAL_TITLES.find(([prefix]) => pathname.startsWith(prefix));
    const pageLabel = match ? match[1] : 'Portal';
    document.title = `${pageLabel} — Rotaract NYC`;
  }, [pathname]);

  return skipShell ? <>{children}</> : <PortalShell>{children}</PortalShell>;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalContent>{children}</PortalContent>
    </AuthProvider>
  );
}
