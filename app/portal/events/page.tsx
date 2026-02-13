'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import SearchInput from '@/components/ui/SearchInput';
import { defaultEvents } from '@/lib/defaults/data';
import { formatDate } from '@/lib/utils/format';
import type { RSVPStatus } from '@/types';

export default function PortalEventsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const events = defaultEvents.filter(
    (e) => e.title.toLowerCase().includes(search.toLowerCase()) ||
           e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">RSVP to upcoming events and track your attendance.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search events..." className="sm:max-w-xs" />
        <Tabs
          tabs={[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} padding="none" className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Date sidebar */}
              <div className="sm:w-24 bg-cranberry-50 dark:bg-cranberry-900/20 flex sm:flex-col items-center justify-center p-4 gap-1">
                <p className="text-xs font-bold text-cranberry uppercase">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className="text-2xl font-display font-bold text-cranberry-800 dark:text-cranberry-300">
                  {new Date(event.date).getDate()}
                </p>
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-gray-900 dark:text-white">{event.title}</h3>
                      <Badge variant={event.type === 'service' ? 'azure' : event.type === 'paid' ? 'gold' : 'green'}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {event.time} – {event.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        {event.location.split(',')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="primary">Going</Button>
                    <Button size="sm" variant="ghost">Maybe</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
