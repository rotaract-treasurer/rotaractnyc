export function generateCalendarURL(event: {
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
}): string {
  const startDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: event.description || '',
    location: event.location || '',
    sf: 'true',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
