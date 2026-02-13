'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();

/**
 * Global toast notification hook.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast('Success!');
 *   toast('Error occurred', 'error');
 */
export function useToast() {
  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const t: Toast = { id: ++toastId, message, type };
      listeners.forEach((listener) => listener(t));
    },
    [],
  );

  return { toast };
}

/**
 * Hook for the toast container to listen for new toasts.
 * Used internally by the Toast component.
 */
export function useToastListener() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
      }, 4000);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}
