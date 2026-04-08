'use client';

import { useTutorial } from './useTutorial';

interface TutorialLauncherProps {
  track: 'member' | 'admin';
}

export function TutorialLauncher({ track }: TutorialLauncherProps) {
  const { start, skip } = useTutorial();

  const isAdmin = track === 'admin';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header illustration */}
        <div className="bg-gradient-to-br from-cranberry/10 via-cranberry/5 to-transparent dark:from-cranberry/20 dark:via-cranberry/10 px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-cranberry/10 dark:bg-cranberry/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isAdmin ? (
              <svg className="w-8 h-8 text-cranberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-cranberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
            {isAdmin ? 'Ready to Manage Your Club?' : 'Welcome to the Portal!'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
            {isAdmin
              ? 'Take a quick tour of your admin tools — we\'ll show you where to manage members, events, communications, and more.'
              : 'Let us show you around! We\'ll walk you through the key features so you know exactly where to find everything.'}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 py-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => start(track)}
            className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-cranberry hover:bg-cranberry-700 rounded-xl transition-colors shadow-sm"
          >
            {isAdmin ? 'Tour Admin Tools' : 'Start Tour'}
          </button>
          <button
            onClick={skip}
            className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
