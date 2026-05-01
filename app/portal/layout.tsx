'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/firebase/auth';
import PortalShell from '@/components/portal/PortalShell';

// Pages that render their own chrome (no sidebar / auth gate)
const SHELL_EXCLUDED = ['/portal/login', '/portal/onboarding/success'];

// Inner component that has access to auth context
function PortalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { member } = useAuth();
  const skipShell = SHELL_EXCLUDED.some((p) => pathname === p);

  const isAdminOrBoard = member?.role === 'board' || member?.role === 'president' || member?.role === 'treasurer';

  useEffect(() => {
    const manifestHref = isAdminOrBoard ? '/admin-manifest.json' : '/manifest.json';
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;
  }, [isAdminOrBoard]);

  return skipShell ? <>{children}</> : <PortalShell>{children}</PortalShell>;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalContent>{children}</PortalContent>
    </AuthProvider>
  );
}
