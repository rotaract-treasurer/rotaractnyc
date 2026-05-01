'use client';

import { useState } from 'react';
import { Calendar, Chrome, Download, Share2, Check, MapPin } from 'lucide-react';
import { generateCalendarURL, downloadICSFile, getGoogleMapsUrl } from '@/lib/utils/calendar';

interface PublicEventActionsProps {
  event: {
    title: string;
    slug: string;
    date: string;
    endDate?: string;
    time: string;
    endTime?: string;
    location?: string;
    address?: string;
    description?: string;
  };
}

/**
 * Client-side action buttons for the public event detail page.
 * Add to Calendar (Google + iCal), Share, Directions.
 */
export default function PublicEventActions({ event }: PublicEventActionsProps) {
  const [calOpen, setCalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const googleCalUrl = generateCalendarURL({
    title: event.title,
    date: event.date,
    endDate: event.endDate,
    time: event.time,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
  });

  const mapsUrl = getGoogleMapsUrl(event.location, event.address);

  const handleICS = () => {
    downloadICSFile({
      title: event.title,
      date: event.date,
      endDate: event.endDate,
      time: event.time,
      endTime: event.endTime,
      location: event.location,
      address: event.address,
      description: event.description,
    });
    setCalOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event.slug}`;
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url });
        return;
      } catch {}
    }
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const btnClass =
    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ' +
    'bg-white/10 backdrop-blur-sm border border-white/20 text-white ' +
    'hover:bg-white/20 transition-all duration-200';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Add to Calendar */}
      <div className="relative">
        <button onClick={() => setCalOpen((v) => !v)} className={btnClass}>
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </button>

        {calOpen && (
          <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-1.5">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCalOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Chrome className="w-4 h-4 text-blue-500" /> Google Calendar
              </a>
              <button
                onClick={handleICS}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4 text-gray-500" /> Apple / Outlook (.ics)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share */}
      <button onClick={handleShare} className={btnClass}>
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Share
          </>
        )}
      </button>

      {/* Directions */}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <MapPin className="w-4 h-4" />
          Directions
        </a>
      )}
    </div>
  );
}
