'use client';

import { AuthProvider } from '@/lib/firebase/auth';
import PortalNav from './_components/PortalNav';
import { usePathname } from 'next/navigation';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col antialiased text-[#141414] dark:text-white">
          <PortalNav />
          {children}
        </div>
      )}
    </AuthProvider>
  );
}
