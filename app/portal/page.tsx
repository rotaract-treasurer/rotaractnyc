'use client';

import { useAuth } from '@/lib/firebase/auth';
import CommunityFeed from './_components/CommunityFeed';
import PortalExtras from './_components/PortalExtras';

export default function PortalDashboard() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 col-span-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#17b0cf]"></div>
      </div>
    );
  }

  return (
    <>
      <CommunityFeed />
      <PortalExtras />
    </>
  );
}
