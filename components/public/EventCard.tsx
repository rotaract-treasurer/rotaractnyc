import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { RotaractEvent } from '@/types';

interface EventCardProps {
  event: RotaractEvent;
  compact?: boolean;
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const isPast = date < new Date();

  return (
    <Link href={`/events/${event.slug}`}>
      <Card interactive padding="none" className="overflow-hidden group">
        <div className="flex">
          {/* Date badge */}
          <div className="shrink-0 w-20 bg-cranberry-50 dark:bg-cranberry-900/20 flex flex-col items-center justify-center p-3">
            <span className="text-xs font-bold text-cranberry uppercase">{month}</span>
            <span className="text-2xl font-display font-bold text-cranberry-800 dark:text-cranberry-300">{day}</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-gray-900 dark:text-white group-hover:text-cranberry transition-colors line-clamp-1">
                {event.title}
              </h3>
              <Badge variant={event.type === 'service' ? 'azure' : event.type === 'paid' ? 'gold' : 'green'}>
                {event.type}
              </Badge>
              {isPast && <Badge variant="gray">Past</Badge>}
            </div>

            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                🕐 {event.time}
                {event.endTime ? ` – ${event.endTime}` : ''}
              </span>
              <span className="flex items-center gap-1">
                📍 {event.location?.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
