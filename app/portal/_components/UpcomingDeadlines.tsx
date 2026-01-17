'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import { Event } from '@/types/portal';

interface Deadline {
  title: string;
  daysLeft?: number;
  dueDate?: string;
  urgency: 'urgent' | 'warning' | 'normal';
}

export default function UpcomingDeadlines() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const app = getFirebaseClientApp();
      if (!app) return;
      const db = getFirestore(app);

      try {
        const ref = collection(db, 'portalEvents');
        const q = query(
          ref,
          where('visibility', '==', 'member'),
          where('startAt', '>=', Timestamp.now()),
          orderBy('startAt', 'asc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;

        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Event[]);
      } catch (err) {
        console.error('Error loading upcoming deadlines:', err);
        if (!cancelled) setEvents([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const deadlines: Deadline[] = useMemo(() => {
    return events.map((e) => {
      const start = e.startAt?.toDate ? e.startAt.toDate() : new Date();
      const diffDays = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const urgency: Deadline['urgency'] = diffDays <= 3 ? 'urgent' : diffDays <= 10 ? 'warning' : 'normal';
      return {
        title: e.title,
        daysLeft: diffDays >= 0 ? diffDays : 0,
        urgency,
      };
    });
  }, [events]);

  const getUrgencyColor = (urgency: Deadline['urgency']) => {
    const colors = {
      urgent: 'bg-red-500',
      warning: 'bg-orange-400',
      normal: 'bg-gray-300 dark:bg-gray-600'
    };
    return colors[urgency];
  };

  const getUrgencyText = (deadline: Deadline) => {
    if (deadline.daysLeft !== undefined) {
      return (
        <p className="text-xs text-red-500 font-medium mt-0.5">
          {deadline.daysLeft} days left
        </p>
      );
    }
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Due {deadline.dueDate}
      </p>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-[#2a2a2a] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#141414] dark:text-white text-base font-bold">
          Upcoming Deadlines
        </h3>
        <a 
          href="/portal/events" 
          className="text-xs text-rotaract-blue hover:underline"
        >
          View All
        </a>
      </div>
      <div className="space-y-4">
        {deadlines.map((deadline, index) => (
          <div key={index} className="flex gap-3 relative">
            {/* Timeline line */}
            {index < deadlines.length - 1 && (
              <div className="absolute left-[5px] top-2 bottom-[-16px] w-[2px] bg-gray-100 dark:bg-[#333]"></div>
            )}
            <div 
              className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-white dark:ring-[#1e1e1e] ${getUrgencyColor(deadline.urgency)}`}
            />
            <div>
              <p className="text-sm font-bold text-primary dark:text-white leading-tight">
                {deadline.title}
              </p>
              {getUrgencyText(deadline)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
