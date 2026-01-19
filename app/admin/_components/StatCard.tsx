'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  subtitle,
}: StatCardProps) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-lg ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span
              className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                trend.positive
                  ? 'text-green-600 bg-green-50 border-green-100'
                  : trend.neutral
                  ? 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  : 'text-red-600 bg-red-50 border-red-100'
              }`}
            >
              {trend.positive && (
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
              )}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
