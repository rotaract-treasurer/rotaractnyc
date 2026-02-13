import { notFound } from 'next/navigation';
import Link from 'next/link';
import { defaultEvents } from '@/lib/defaults/data';
import { formatDate } from '@/lib/utils/format';
import Badge from '@/components/ui/Badge';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = defaultEvents.find((e) => e.slug === slug);

  if (!event) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative py-28 sm:py-36 bg-gradient-to-br from-cranberry-900 via-cranberry to-cranberry-800 text-white overflow-hidden">
        <div className="container-page relative z-10">
          <Link href="/events" className="inline-flex items-center gap-1 text-cranberry-200 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Events
          </Link>
          <Badge variant={event.type === 'service' ? 'azure' : event.type === 'paid' ? 'gold' : 'green'} className="mb-4">
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold">{event.title}</h1>
        </div>
      </section>

      {/* Details */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-page">
          <div className="max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date & Time</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(event.date)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.time}{event.endTime ? ` – ${event.endTime}` : ''}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                <p className="font-semibold text-gray-900 dark:text-white">{event.location}</p>
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p>{event.description}</p>
            </div>

            {/* Auth-aware CTA */}
            <div className="mt-10 p-6 bg-cranberry-50 dark:bg-cranberry-900/10 rounded-2xl border border-cranberry-100 dark:border-cranberry-900/30">
              <h3 className="font-display font-bold text-gray-900 dark:text-white mb-2">Want to attend?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sign in to your member portal to RSVP, or join Rotaract NYC to access all events.
              </p>
              <div className="flex gap-3">
                <Link href="/portal/login" className="btn-sm btn-primary">Member RSVP</Link>
                <Link href="/membership" className="btn-sm btn-outline">Join Us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
