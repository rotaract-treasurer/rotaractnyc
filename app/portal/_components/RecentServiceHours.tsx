'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';

interface ServiceHourSubmission {
  id: string;
  eventName: string;
  hours: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function RecentServiceHours() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ServiceHourSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubmissions();
    }
  }, [user]);

  const loadSubmissions = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/portal/service-hours?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading service hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 uppercase">
            Rejected
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 uppercase">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-[#2a2a2a] p-5">
        <h3 className="text-[#141414] dark:text-white text-base font-bold mb-3">
          Recent Service Hours
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-[#2a2a2a] p-5">
      <h3 className="text-[#141414] dark:text-white text-base font-bold mb-3">
        Recent Service Hours
      </h3>
      
      {submissions.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-white/20 mb-2">
            volunteer_activism
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No service hours logged yet.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Start tracking your impact!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold text-[#141414] dark:text-white">
                  {submission.eventName}
                </span>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-xs text-gray-600 dark:text-white/60">
                {formatDate(submission.date)} • {submission.hours} {submission.hours === 1 ? 'Hour' : 'Hours'}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {submissions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Total: <span className="font-bold text-primary">
              {submissions.reduce((sum, s) => sum + s.hours, 0)} hours
            </span> (Last 5 submissions)
          </p>
        </div>
      )}
    </div>
  );
}
