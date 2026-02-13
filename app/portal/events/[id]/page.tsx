'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { apiGet, apiPost, useRsvps } from '@/hooks/useFirestore';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import EventRegistration from '@/components/portal/EventRegistration';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { RotaractEvent, RSVPStatus } from '@/types';

const typeColors: Record<string, 'green' | 'cranberry' | 'azure' | 'gold' | 'gray'> = {
  service: 'green',
  social: 'cranberry',
  fundraiser: 'gold',
  meeting: 'azure',
  free: 'gray',
};

export default function PortalEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<RotaractEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRSVP, setCurrentRSVP] = useState<RSVPStatus | null>(null);
  const { data: rsvps } = useRsvps(id);

  const fetchEvent = useCallback(async () => {
    try {
      const data = await apiGet(`/api/events?id=${id}`);
      if (Array.isArray(data)) {
        const found = data.find((e: RotaractEvent) => e.id === id);
        setEvent(found || null);
      } else {
        setEvent(data);
      }
    } catch {
      toast('Failed to load event', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (rsvps && user) {
      const myRsvp = rsvps.find((r) => r.memberId === user.uid);
      setCurrentRSVP((myRsvp?.status as RSVPStatus) || null);
    }
  }, [rsvps, user]);

  const handleRSVP = async (status: RSVPStatus) => {
    try {
      await apiPost('/api/portal/events/rsvp', { eventId: id, status });
      setCurrentRSVP(status);
      toast(status === 'going' ? "You're going! 🎉" : 'RSVP updated');
    } catch (err: any) {
      toast(err.message || 'RSVP failed', 'error');
    }
  };

  const handlePurchaseTicket = async (ticketType: 'member' | 'guest') => {
    try {
      const res = await apiPost('/api/portal/events/checkout', { eventId: id, ticketType });
      if (res.url) {
        window.location.href = res.url;
      } else if (res.free) {
        toast(res.message || "You're in! 🎉");
        setCurrentRSVP('going');
      }
    } catch (err: any) {
      toast(err.message || 'Checkout failed', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!event) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Event not found.</p>
      <Button variant="secondary" onClick={() => router.push('/portal/events')}>Back to Events</Button>
    </div>
  );

  const goingCount = rsvps?.filter((r) => r.status === 'going').length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-cranberry transition-colors flex items-center gap-1">
        ← Back to events
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={typeColors[event.type] || 'gray'}>{event.type}</Badge>
              {(event as RotaractEvent & { isFeatured?: boolean }).isFeatured && <Badge variant="gold">Featured</Badge>}
            </div>

            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{event.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">📅 {formatDate(event.date)}</span>
              <span className="flex items-center gap-1">🕐 {event.time}</span>
              {event.location && <span className="flex items-center gap-1">📍 {event.location}</span>}
              {event.capacity && <span className="flex items-center gap-1">👥 Capacity: {event.capacity}</span>}
            </div>

            {/* Image */}
            {event.imageURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageURL} alt={event.title} className="mt-6 rounded-xl w-full h-64 object-cover" />
            )}

            {/* Description */}
            <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{event.description}</p>
            </div>
          </Card>

          {/* Attendees */}
          {rsvps && rsvps.length > 0 && (
            <Card padding="md">
              <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Attendees ({goingCount})</h3>
              <div className="flex flex-wrap gap-2">
                {rsvps
                  .filter((r) => r.status === 'going')
                  .map((r) => (
                    <div key={r.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full pl-1 pr-3 py-1">
                      <Avatar src={r.memberPhoto} alt={r.memberName} size="sm" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{r.memberName}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <EventRegistration
            event={event}
            currentRSVP={currentRSVP}
            onRSVP={handleRSVP}
            onPurchaseTicket={handlePurchaseTicket}
            attendeeCount={goingCount}
          />
        </div>
      </div>
    </div>
  );
}
