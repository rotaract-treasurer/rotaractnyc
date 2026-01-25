'use client';

import { AuthProvider } from '@/lib/firebase/auth';
import PortalNav from './_components/PortalNav';
import DuesBanner from '@/components/portal/DuesBanner';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { useEffect } from 'react';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  return (
    <AuthProvider>
      {isLoginPage ? children : <PortalShell>{children}</PortalShell>}
    </AuthProvider>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, signOut } = useAuth();

  // Avoid returning null during auth transitions; always render a useful UI.
  // Redirects are handled in effects to prevent blank screens.
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/portal/login';
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="page-bg font-display flex items-center justify-center antialiased text-text-primary dark:text-text-primary-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted dark:text-text-muted-dark">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-bg font-display flex items-center justify-center antialiased text-text-primary dark:text-text-primary-dark px-6">
        <div className="card w-full max-w-lg p-6">
          <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Sign in required</h1>
          <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">
            Please sign in to access the member portal.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => (window.location.href = '/portal/login')}
              className="btn-primary"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = userData?.status;
  const isApproved = status === 'active';

  if (!isApproved) {
    return (
      <div className="page-bg font-display flex items-center justify-center antialiased text-text-primary dark:text-text-primary-dark px-6">
        <div className="card w-full max-w-lg p-6">
          <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">Awaiting approval</h1>
          <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">
            Your portal account is pending member approval. An admin needs to approve your account before you can view member content.
          </p>
          <p className="mt-3 text-xs text-text-muted dark:text-text-muted-dark">
            Signed in as: {user.email}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/portal/login';
              }}
              className="btn-primary"
            >
              Sign out
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-outline"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg font-display flex flex-col antialiased text-text-primary dark:text-text-primary-dark">
      <PortalNav />
      <div className="container-main pt-6">
        <DuesBanner memberId={user.uid} />
      </div>
      {children}
    </div>
  );
}
