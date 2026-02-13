'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn('divide-y divide-gray-200 dark:divide-gray-800', className)}>
      {items.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="flex items-center justify-between w-full py-5 text-left group"
          >
            <span className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-cranberry transition-colors">
              {item.title}
            </span>
            <svg
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform duration-200',
                openId === item.id && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              openId === item.id ? 'max-h-96 pb-5' : 'max-h-0'
            )}
          >
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
