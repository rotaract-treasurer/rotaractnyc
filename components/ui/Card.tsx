import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className, interactive = false, padding = 'md', onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-gray-200/60 shadow-sm dark:bg-gray-900 dark:border-gray-800',
        interactive && 'hover:shadow-md hover:border-cranberry-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:hover:border-cranberry-800',
        !interactive && 'transition-shadow duration-200',
        paddings[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}
