'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { getFirebaseClientApp } from '@/lib/firebase/client';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { Event, RSVPStatus } from '@/types/portal';

export default function PortalEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvp, setRsvp] = useState<RSVPStatus | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, id]);

  const load = async () => {
    const app = getFirebaseClientApp();
    if (!app || !user) return;
    const db = getFirestore(app);

    setLoadingData(true);
    try {
      const eventRef = doc(db, 'portalEvents', String(id));
      const snap = await getDoc(eventRef);
      if (!snap.exists()) {
        setEvent(null);
        return;
      }
      setEvent({ id: snap.id, ...(snap.data() as any) } as Event);

      const rsvpRef = doc(db, 'portalEvents', String(id), 'rsvps', user.uid);
      const rsvpSnap = await getDoc(rsvpRef);
      setRsvp(rsvpSnap.exists() ? ((rsvpSnap.data() as any).status as RSVPStatus) : null);
    } catch (e) {
      console.error('Error loading event detail:', e);
      setEvent(null);
    } finally {
      setLoadingData(false);
    }
  };

  const setRsvpStatus = async (status: RSVPStatus) => {
    if (!user) return;
    const app = getFirebaseClientApp();
    if (!app) return;
    const db = getFirestore(app);

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'portalEvents', String(id), 'rsvps', user.uid),
        {
          uid: user.uid,
          eventId: String(id),
          status,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setRsvp(status);
    } catch (e) {
      console.error('Error updating RSVP:', e);
      alert('Failed to update RSVP. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const when = useMemo(() => {
    if (!event?.startAt) return '';
    const start = (event.startAt as unknown as Timestamp).toDate?.()
      ? (event.startAt as unknown as Timestamp).toDate()
      : new Date();
    return start.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [event?.startAt]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">event_busy</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This event may have been removed or you don't have access to view it.
          </p>
          <button
            onClick={() => router.push('/portal/events')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to events
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <button
          onClick={() => router.push('/portal/events')}
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Events
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] sm:max-w-none">
          {event.title}
        </span>
      </nav>

      {/* Hero Image Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        {/* Event Hero Image */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-gradient-to-br from-primary to-blue-500">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), linear-gradient(135deg, #a855f7 0%, #6366f1 100%)`
            }}
          />
          
          {/* Event Type Badge */}
          <div className="absolute top-6 left-6">
            <span className={`px-4 py-2 backdrop-blur-md text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg ${
              event.visibility === 'member'
                ? 'bg-secondary-accent/90 text-white'
                : 'bg-white/90 text-gray-800'
            }`}>
              {event.visibility === 'member' ? '👥 Members Only' : '🌍 Public Event'}
            </span>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-2 leading-tight drop-shadow-lg">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-white/90">
              <div className="flex items-center gap-1.5 text-sm sm:text-base font-medium">
                <span className="material-symbols-outlined text-lg">schedule</span>
                {when}
              </div>
              {event.location && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5 text-sm sm:text-base font-medium">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    {event.location}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6 sm:p-8">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-primary mb-1">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
                <span className="text-xs font-semibold uppercase tracking-wide">Date & Time</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">{when}</p>
            </div>
            
            {event.location && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <span className="material-symbols-outlined text-xl">location_on</span>
                  <span className="text-xs font-semibold uppercase tracking-wide">Location</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{event.location}</p>
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <span className="material-symbols-outlined text-xl">group</span>
                <span className="text-xs font-semibold uppercase tracking-wide">Your Status</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {rsvp === 'going' ? '✓ Going' : rsvp === 'maybe' ? '🤔 Maybe' : rsvp === 'not' ? '✗ Not Going' : 'No Response'}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">description</span>
                About This Event
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* RSVP Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">event_available</span>
              Your RSVP
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Let us know if you'll be attending this event
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setRsvpStatus('going')}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  rsvp === 'going'
                    ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                <span className="material-symbols-outlined">check_circle</span>
                {rsvp === 'going' ? 'Going ✓' : 'I\'m Going'}
              </button>
              <button
                onClick={() => setRsvpStatus('maybe')}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  rsvp === 'maybe'
                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-yellow-500 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                }`}
              >
                <span className="material-symbols-outlined">help</span>
                {rsvp === 'maybe' ? 'Maybe ?' : 'Maybe'}
              </button>
              <button
                onClick={() => setRsvpStatus('not')}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  rsvp === 'not'
                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-red-600 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <span className="material-symbols-outlined">cancel</span>
                {rsvp === 'not' ? 'Can\'t Go ✗' : 'Can\'t Go'}
              </button>
            </div>
            {saving && (
              <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                Updating your RSVP...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => router.push('/portal/events')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to All Events
        </button>
      </div>
    </main>
  );
}
