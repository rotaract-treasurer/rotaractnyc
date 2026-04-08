'use client';

import { useState, useEffect, useCallback } from 'react';

interface ArticleLikeButtonProps {
  slug: string;
  initialLikeCount?: number;
}

/**
 * Interactive like button for news articles.
 * Uses localStorage for instant UI + server IP-hash for persistence.
 * Only displays the count badge when likeCount > 10.
 */
export default function ArticleLikeButton({
  slug,
  initialLikeCount = 0,
}: ArticleLikeButtonProps) {
  const storageKey = `article-liked:${slug}`;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount — read localStorage then reconcile with server
  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(storageKey) === 'true') setLiked(true);
    } catch {
      // localStorage unavailable (SSR, incognito, etc.)
    }

    fetch(`/api/news/${slug}/likes`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data: { liked: boolean; likeCount: number }) => {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        try {
          localStorage.setItem(storageKey, String(data.liked));
        } catch { /* noop */ }
      })
      .catch(() => {
        // Use localStorage / initial state as fallback
      });
  }, [slug, storageKey]);

  const toggleLike = useCallback(async () => {
    const newLiked = !liked;

    // Optimistic update
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    setIsAnimating(true);
    try {
      localStorage.setItem(storageKey, String(newLiked));
    } catch { /* noop */ }
    setTimeout(() => setIsAnimating(false), 600);

    try {
      const res = await fetch(`/api/news/${slug}/likes`, { method: 'POST' });
      if (res.ok) {
        const data: { liked: boolean; likeCount: number } = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        try {
          localStorage.setItem(storageKey, String(data.liked));
        } catch { /* noop */ }
      }
    } catch {
      // Revert on network error
      setLiked(!newLiked);
      setLikeCount((c) => (newLiked ? Math.max(0, c - 1) : c + 1));
      try {
        localStorage.setItem(storageKey, String(!newLiked));
      } catch { /* noop */ }
    }
  }, [liked, slug, storageKey]);

  // SSR / pre-hydration placeholder
  if (!mounted) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-800"
      >
        <HeartIcon filled={false} />
        Like
      </button>
    );
  }

  return (
    <button
      onClick={toggleLike}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
        liked
          ? 'text-cranberry bg-cranberry-50 dark:bg-cranberry-900/30 hover:bg-cranberry-100 dark:hover:bg-cranberry-900/50'
          : 'text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-cranberry'
      }`}
      aria-label={liked ? 'Unlike this article' : 'Like this article'}
      aria-pressed={liked}
    >
      <HeartIcon filled={liked} animating={isAnimating} />
      {liked ? 'Liked' : 'Like'}
      {likeCount > 10 && (
        <span className="text-xs opacity-75">· {likeCount}</span>
      )}
    </button>
  );
}

function HeartIcon({
  filled,
  animating = false,
}: {
  filled: boolean;
  animating?: boolean;
}) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-300 ${animating ? 'scale-125' : 'scale-100'}`}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
