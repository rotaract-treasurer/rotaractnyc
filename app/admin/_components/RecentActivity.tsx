'use client';

interface ActivityItem {
  id: string;
  type: 'member' | 'event' | 'post' | 'gallery';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'member',
    title: 'New member joined',
    description: 'John Smith joined the club',
    timestamp: '2 hours ago',
    user: 'John Smith',
  },
  {
    id: '2',
    type: 'event',
    title: 'Event published',
    description: 'Annual Gala event is now live',
    timestamp: '5 hours ago',
    user: 'Admin',
  },
  {
    id: '3',
    type: 'post',
    title: 'New blog post',
    description: 'Community Service Initiative 2026',
    timestamp: '1 day ago',
    user: 'Sarah Johnson',
  },
  {
    id: '4',
    type: 'gallery',
    title: 'Photos uploaded',
    description: '15 photos added to Holiday Event',
    timestamp: '2 days ago',
    user: 'Mike Chen',
  },
];

export default function RecentActivity() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'member':
        return 'person_add';
      case 'event':
        return 'event';
      case 'post':
        return 'article';
      case 'gallery':
        return 'photo_library';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'member':
        return 'bg-blue-500/10 text-blue-600';
      case 'event':
        return 'bg-purple-500/10 text-purple-600';
      case 'post':
        return 'bg-green-500/10 text-green-600';
      case 'gallery':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Latest updates across your club
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(activity.type)}`}>
                <span className="material-symbols-outlined text-[20px]">{getIcon(activity.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.user && (
                    <>
                      <span className="text-xs text-gray-400">{activity.user}</span>
                      <span className="text-xs text-gray-300">•</span>
                    </>
                  )}
                  <span className="text-xs text-gray-400">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button className="w-full text-center text-sm font-medium text-primary hover:text-blue-700 transition-colors">
          View all activity
        </button>
      </div>
    </div>
  );
}
