'use client';

interface TutorialProgressProps {
  current: number;
  total: number;
}

export function TutorialProgress({ current, total }: TutorialProgressProps) {
  return (
    <div className="flex items-center gap-1.5 justify-center" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 bg-cranberry'
              : i < current
                ? 'w-1.5 bg-cranberry/40'
                : 'w-1.5 bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}
