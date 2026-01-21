'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';

interface ServiceHourSubmission {
  id: string;
  uid: string;
  eventName: string;
  hours: number;
  date: Date;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  memberName?: string;
}

export default function ServiceHoursReviewPage() {
  const { userData, loading } = useAuth();
  const [submissions, setSubmissions] = useState<ServiceHourSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      loadSubmissions();
    }
  }, [loading, filter]);

  const loadSubmissions = async () => {
    setLoadingData(true);
    const app = getFirebaseClientApp();
    if (!app) return;

    const db = getFirestore(app);
    
    try {
      const submissionsRef = collection(db, 'serviceHours');
      let submissionsQuery;

      if (filter === 'all') {
        submissionsQuery = query(
          submissionsRef,
          orderBy('createdAt', 'desc')
        );
      } else {
        submissionsQuery = query(
          submissionsRef,
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(submissionsQuery);
      const submissionsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Fetch member name
          let memberName = 'Unknown Member';
          try {
            const userDoc = await getDoc(doc(db, 'users', data.uid));
            if (userDoc.exists()) {
              memberName = userDoc.data().name || memberName;
            }
          } catch (error) {
            console.error('Error loading member:', error);
          }

          return {
            id: docSnapshot.id,
            uid: data.uid,
            eventName: data.eventName,
            hours: data.hours,
            date: data.date?.toDate(),
            notes: data.notes,
            status: data.status,
            createdAt: data.createdAt?.toDate(),
            memberName,
          };
        })
      );

      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleReview = async (submissionId: string, status: 'approved' | 'rejected', reviewNotes?: string) => {
    if (!userData) return;

    setProcessing(submissionId);
    
    try {
      const app = getFirebaseClientApp();
      if (!app) return;

      const db = getFirestore(app);
      const submissionRef = doc(db, 'serviceHours', submissionId);

      await updateDoc(submissionRef, {
        status,
        reviewedBy: userData.uid,
        reviewedAt: Timestamp.now(),
        reviewNotes: reviewNotes || '',
        updatedAt: Timestamp.now(),
      });

      // Refresh the list
      await loadSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getTotalHours = () => {
    return submissions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.hours, 0);
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has admin access
  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'BOARD')) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
            lock
          </span>
          <h1 className="text-2xl font-bold text-[#141414] dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to review service hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#141414] dark:text-white mb-2">
          Service Hours Review
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Review and approve member service hour submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Pending Review
          </p>
          <p className="text-3xl font-extrabold text-[#141414] dark:text-white">
            {submissions.filter(s => s.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Total Approved Hours
          </p>
          <p className="text-3xl font-extrabold text-primary">
            {getTotalHours()}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Approved
          </p>
          <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
            {submissions.filter(s => s.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Rejected
          </p>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
            {submissions.filter(s => s.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${
              filter === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-[#141414] dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-12 text-center border border-gray-100 dark:border-[#2a2a2a]">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
            volunteer_activism
          </span>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-100 dark:border-[#2a2a2a] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#141414] dark:text-white">
                      {submission.eventName}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        submission.status === 'approved'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : submission.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">person</span>
                      {submission.memberName}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {submission.hours} {submission.hours === 1 ? 'hour' : 'hours'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      {formatDate(submission.date)}
                    </span>
                  </div>
                  {submission.notes && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{submission.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {submission.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => handleReview(submission.id, 'approved')}
                    disabled={processing === submission.id}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing === submission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      handleReview(submission.id, 'rejected', reason || undefined);
                    }}
                    disabled={processing === submission.id}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing === submission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">cancel</span>
                        Reject
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
