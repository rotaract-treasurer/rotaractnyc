'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { MemberDues } from '@/types/dues';

export default function DashboardSummary() {
  const { userData } = useAuth();
  const [duesStatus, setDuesStatus] = useState<'PAID' | 'UNPAID' | 'PAID_OFFLINE' | 'WAIVED' | null>(null);
  const [currentCycle, setCurrentCycle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDuesStatus();
  }, [userData?.uid]);

  const loadDuesStatus = async () => {
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
        setCurrentCycle(cycle.data().label || cycle.id);

        // Get member's dues for this cycle
        const memberDuesRef = collection(db, 'member_dues', userData.uid, 'cycles');
        const duesQuery = query(memberDuesRef, where('cycleId', '==', cycle.id), limit(1));
        const duesSnapshot = await getDocs(duesQuery);

        if (!duesSnapshot.empty) {
          const dues = duesSnapshot.docs[0].data() as MemberDues;
          setDuesStatus(dues.status);
        } else {
          setDuesStatus('UNPAID');
        }
      }
    } catch (error) {
      console.error('Error loading dues status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!userData) return null;

    const isActive = userData.status === 'active';
    const statusColor = isActive 
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getDuesBadge = () => {
    if (loading) return <span className="text-sm text-gray-400">Loading...</span>;
    if (!duesStatus) return null;

    const isPaid = duesStatus === 'PAID' || duesStatus === 'PAID_OFFLINE' || duesStatus === 'WAIVED';
    const badgeColor = isPaid
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
        <span className={`material-symbols-outlined text-sm`}>
          {isPaid ? 'check_circle' : 'schedule'}
        </span>
        {isPaid ? 'Paid' : 'Due'}
      </span>
    );
  };

  const firstName = userData?.name?.split(' ')[0] || 'Member';
  const currentYear = new Date().getFullYear();
  const rotaryYear = new Date().getMonth() >= 6 ? `${currentYear}–${currentYear + 1}` : `${currentYear - 1}–${currentYear}`;

  return (
    <div className="bg-gradient-to-br from-rotaract-blue to-blue-600 dark:from-blue-900 dark:to-blue-950 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex flex-col gap-4">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome back, {firstName}!
          </h1>
          <p className="text-blue-100 dark:text-blue-200 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Membership Status */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs text-blue-100 dark:text-blue-200 mb-1 font-medium">Membership</div>
            {getStatusBadge()}
          </div>

          {/* Rotary Year */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs text-blue-100 dark:text-blue-200 mb-1 font-medium">Rotary Year</div>
            <div className="text-sm font-bold">{rotaryYear}</div>
          </div>

          {/* Dues Status */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs text-blue-100 dark:text-blue-200 mb-1 font-medium">Dues Status</div>
            {getDuesBadge()}
          </div>

          {/* Cycle Info */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-xs text-blue-100 dark:text-blue-200 mb-1 font-medium">Current Cycle</div>
            <div className="text-sm font-bold">{currentCycle || 'RY ' + (currentYear + 1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
