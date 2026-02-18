import type { Metadata } from 'next';
import HeroSection from '@/components/public/HeroSection';
import EventsFilter from '@/components/public/EventsFilter';
import { generateMeta } from '@/lib/seo';
import { getPublicEvents } from '@/lib/firebase/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateMeta({
  title: 'Events',
  description: 'Browse upcoming Rotaract NYC events — service projects, meetings, networking mixers, and social gatherings.',
  path: '/events',
});

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <>
      <HeroSection title="Events" subtitle="Join us for service projects, professional development, networking, and fellowship." size="sm" />

      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-page">
          <EventsFilter events={events} />
        </div>
      </section>
    </>
  );
}
