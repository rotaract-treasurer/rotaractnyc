'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { MemberDues } from '@/types/dues';
import Link from 'next/link';

export default function DashboardQuickActions() {
  const { userData } = useAuth();
  const [showPayDues, setShowPayDues] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDuesStatus();
  }, [userData?.uid]);

  const checkDuesStatus = async () => {
    if (!userData?.uid) return;

    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);

    try {
      // Get active cycle
      const cyclesRef = collection(db, 'dues_cycles');
      const activeCycleQuery = query(cyclesRef, where('isActive', '==', true), limit(1));
      const cycleSnapshot = await getDocs(activeCycleQuery);

      if (!cycleSnapshot.empty) {
        const cycle = cycleSnapshot.docs[0];

        // Get member's dues for this cycle
        const memberDuesRef = collection(db, 'member_dues', userData.uid, 'cycles');
        const duesQuery = query(memberDuesRef, where('cycleId', '==', cycle.id), limit(1));
        const duesSnapshot = await getDocs(duesQuery);

        if (!duesSnapshot.empty) {
          const dues = duesSnapshot.docs[0].data() as MemberDues;
          const needsPayment = dues.status === 'UNPAID';
          setShowPayDues(needsPayment);
        } else {
          setShowPayDues(true); // No record means unpaid
        }
      }
    } catch (error) {
      console.error('Error checking dues status:', error);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    ...(showPayDues && !loading ? [{
      label: 'Pay Dues',
      href: '/portal/finance',
      icon: 'payments',
      color: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700',
      textColor: 'text-white',
    }] : []),
    {
      label: 'Update Profile',
      href: '/portal/settings',
      icon: 'person',
      color: 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
    {
      label: 'View Directory',
      href: '/portal/directory',
      icon: 'group',
      color: 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
    {
      label: 'View Events',
      href: '/portal/events',
      icon: 'event',
      color: 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
    {
      label: 'View Documents',
      href: '/portal/docs',
      icon: 'description',
      color: 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]',
      textColor: 'text-gray-700 dark:text-gray-300',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-5">
      <h3 className="text-[#141414] dark:text-white text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-rotaract-blue">bolt</span>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} ${action.textColor} rounded-xl p-4 transition-all shadow-sm border border-gray-100 dark:border-[#2a2a2a] hover:shadow-md flex flex-col items-center justify-center text-center gap-2 min-h-[100px]`}
          >
            <span className="material-symbols-outlined text-3xl">
              {action.icon}
            </span>
            <span className="text-sm font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
