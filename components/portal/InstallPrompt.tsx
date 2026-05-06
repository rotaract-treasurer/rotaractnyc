'use client';

/**
 * InstallPrompt — surfaces the native PWA install banner as a custom button.
 *
 * Listens for the `beforeinstallprompt` event (fired on Chromium-based browsers
 * when the site meets the install criteria), stashes the deferred prompt, and
 * shows a discreet "Install App" button in the portal sidebar / dashboard.
 *
 * iOS Safari does not fire `beforeinstallprompt`; for those users we render an
 * "Add to Home Screen" hint instead with the share-sheet instructions.
 */

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'rotaract_install_dismissed_at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone (already installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari sets navigator.standalone on the home-screen webview
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS Safari (no beforeinstallprompt support)
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(ios);

    // Honour previous dismissal for 14 days
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      setDeferred(null);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
      }
      setDeferred(null);
    } else if (isIos) {
      setShowIosHint(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  // Don't render anything if already installed or recently dismissed
  if (isStandalone || dismissed) return null;
  // Only render if either prompt is available, or iOS (where we show the hint)
  if (!deferred && !isIos) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-cranberry hover:bg-cranberry-700 transition-colors shadow-sm"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Install App
      </button>

      {showIosHint && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How to install on iOS"
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowIosHint(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Install on iPhone</h2>
            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
              <li>
                Tap the <span className="font-semibold">Share</span> button in Safari&apos;s toolbar.
              </li>
              <li>
                Choose <span className="font-semibold">Add to Home Screen</span>.
              </li>
              <li>Tap <span className="font-semibold">Add</span> in the top-right.</li>
            </ol>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  handleDismiss();
                  setShowIosHint(false);
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg"
              >
                Don&apos;t show again
              </button>
              <button
                onClick={() => setShowIosHint(false)}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-cranberry hover:bg-cranberry-700 rounded-lg"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
