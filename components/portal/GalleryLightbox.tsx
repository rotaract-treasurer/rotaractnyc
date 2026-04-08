'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import type { GalleryImage } from '@/types';

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function GalleryLightbox({ images, initialIndex, onClose }: GalleryLightboxProps) {
  const { member } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Per-photo like state (keyed by photo id so it persists while navigating)
  const [likeState, setLikeState] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Seed like state from the photos array
  useEffect(() => {
    const initial: Record<string, { liked: boolean; likes: number }> = {};
    images.forEach((img) => {
      initial[img.id] = {
        likes: img.likes ?? 0,
        liked: member ? (img.likedBy ?? []).includes(member.id) : false,
      };
    });
    setLikeState(initial);
  }, [images, member]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 150);
    },
    [images.length],
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': goPrev(); break;
        case 'ArrowRight': goNext(); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Disable body scroll when lightbox is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!member || likeLoading === current.id) return;

    setLikeLoading(current.id);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch(`/api/portal/gallery/${current.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLikeState((prev) => ({ ...prev, [current.id]: data }));
      }
    } catch {
      // silently ignore
    } finally {
      setLikeLoading(null);
    }
  }

  const currentLike = likeState[current?.id] ?? { liked: false, likes: current?.likes ?? 0 };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        aria-label="Close lightbox"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Like button */}
      {member && (
        <button
          onClick={handleLike}
          disabled={likeLoading === current.id}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
            currentLike.liked
              ? 'bg-cranberry text-white shadow-lg shadow-cranberry/30'
              : 'bg-black/50 text-white hover:bg-black/70'
          } disabled:opacity-50`}
          aria-label={currentLike.liked ? 'Unlike photo' : 'Like photo'}
        >
          <svg
            className={`h-4 w-4 transition-transform ${likeLoading === current.id ? 'scale-75 opacity-50' : currentLike.liked ? 'scale-110' : ''}`}
            viewBox="0 0 24 24"
            fill={currentLike.liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {currentLike.likes > 0 && <span>{currentLike.likes}</span>}
        </button>
      )}

      {/* Previous button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
          aria-label="Previous photo"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 z-10 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
          aria-label="Next photo"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image container — stop propagation so click on image doesn't close */}
      <div
        className="flex max-h-[85vh] max-w-[90vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative transition-opacity duration-150 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={current.url}
            alt={current.caption || current.event || 'Gallery photo'}
            width={1200}
            height={800}
            className="max-h-[75vh] w-auto rounded-lg object-contain"
            priority
          />
        </div>

        {/* Caption, tags, and date below */}
        <div className="mt-3 text-center max-w-lg px-4">
          {current.caption && (
            <p className="text-lg font-medium text-white">{current.caption}</p>
          )}
          {current.event && (
            <p className="mt-1 text-sm text-gray-300">{current.event}</p>
          )}
          {/* Tags */}
          {current.tags && current.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {current.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {current.date && (
            <p className="mt-1.5 text-xs text-gray-400">
              {new Date(current.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
