'use client';

interface Deadline {
  title: string;
  daysLeft?: number;
  dueDate?: string;
  urgency: 'urgent' | 'warning' | 'normal';
}

export default function UpcomingDeadlines() {
  // TODO: Fetch from Firestore or calculate from events
  const deadlines: Deadline[] = [
    { title: "Board Applications Due", daysLeft: 2, urgency: 'urgent' },
    { title: "RSVP for Fall Mixer", dueDate: "Oct 18", urgency: 'warning' },
    { title: "Q4 Dues Payment", dueDate: "Nov 01", urgency: 'normal' },
  ];

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
