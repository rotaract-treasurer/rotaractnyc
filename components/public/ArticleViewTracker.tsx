'use client';

import { useEffect } from 'react';

interface ArticleViewTrackerProps {
  slug: string;
}

/**
 * Invisible client component that records a page view on mount.
 * Fire-and-forget — never blocks rendering.
 */
export default function ArticleViewTracker({ slug }: ArticleViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/news/${slug}/views`, { method: 'POST' }).catch(() => {
      // Silently fail — view tracking is non-critical
    });
  }, [slug]);

  return null;
}
