'use client';

import { AuthProvider } from '@/lib/firebase/auth';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
      <Footer />
    </AuthProvider>
  );
}
