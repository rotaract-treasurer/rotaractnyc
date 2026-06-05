'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker and keeps it self-updating.
 *
 * Behaviour (auto-update, no user prompt):
 *  - Registers `/sw.js`.
 *  - When a new service worker finishes installing and is waiting, we
 *    immediately tell it to `skipWaiting()` so it activates right away.
 *  - When the new worker takes control (`controllerchange`), we reload the
 *    page once so the user is running the latest deployed version.
 *  - We proactively call `registration.update()` on an interval and whenever
 *    the tab regains focus, so an installed PWA that stays open for days still
 *    picks up new deploys instead of waiting for a cold start.
 *
 * The service worker version is stamped at build time (see next.config.js),
 * so every deployment ships a byte-different `/sw.js`, which is what triggers
 * the browser's update detection.
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    // Only reload when WE activate an update — never on the initial install,
    // where the first worker claims the page and fires `controllerchange` too.
    let updateActivated = false;
    let updateInterval: ReturnType<typeof setInterval> | undefined;

    // Tell a waiting worker to activate immediately.
    const activateWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      updateActivated = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // A new worker was already waiting when this page loaded — activate it.
        if (registration.waiting && navigator.serviceWorker.controller) {
          activateWaiting(registration.waiting);
        }

        // Watch for a new worker installing and auto-activate it once ready.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Only auto-activate updates (there is already a controller). On a
            // brand-new install there is no controller and nothing to refresh.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              activateWaiting(newWorker);
            }
          });
        });

        // Check for a new service worker periodically (every 30 min) and when
        // the tab becomes visible again.
        const checkForUpdate = () => {
          registration.update().catch(() => {
            /* offline or transient — ignore */
          });
        };
        updateInterval = setInterval(checkForUpdate, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });

    // When an update we activated takes over, reload once to run the latest
    // version. Guarded so the initial install's claim() doesn't reload.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing || !updateActivated) return;
      refreshing = true;
      window.location.reload();
    });

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  // Updates apply silently — nothing to render.
  return null;
}
