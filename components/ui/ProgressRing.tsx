'use client';

import { cn } from '@/lib/utils/cn';

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'cranberry' | 'gold' | 'azure' | 'emerald';
  className?: string;
}

const colorMap = {
  cranberry: { stroke: 'stroke-cranberry', text: 'text-cranberry', bg: 'text-cranberry-100 dark:text-cranberry-900/30' },
  gold: { stroke: 'stroke-gold-500', text: 'text-gold-600', bg: 'text-gold-100 dark:text-gold-900/30' },
  azure: { stroke: 'stroke-azure-600', text: 'text-azure-600', bg: 'text-azure-100 dark:text-azure-900/30' },
  emerald: { stroke: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'text-emerald-100 dark:text-emerald-900/30' },
};

export default function ProgressRing({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  label,
  sublabel,
  color = 'cranberry',
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;
  const colors = colorMap[color];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={colors.bg}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(colors.stroke, 'transition-all duration-1000 ease-out')}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-xl font-display font-bold tabular-nums', colors.text)}>
            {value}
          </span>
          {sublabel && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{label}</p>
      )}
    </div>
  );
}
