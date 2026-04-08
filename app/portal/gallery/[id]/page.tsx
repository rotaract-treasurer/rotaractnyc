'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';
import GalleryLightbox from '@/components/portal/GalleryLightbox';
import type { GalleryImage } from '@/types';

export default function PortalAlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member, loading: authLoading } = useAuth();
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  const fetchAlbumData = useCallback(async () => {
    try {
      const [albumsRes, photosRes] = await Promise.all([
        fetch('/api/portal/albums'),
        fetch(`/api/portal/albums/${id}/photos`),
      ]);

      if (albumsRes.ok) {
        const albumsList = await albumsRes.json();
        setAlbum(albumsList.find((a: any) => a.id === id) || null);
      }

      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data.photos || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && member) fetchAlbumData();
  }, [authLoading, member, fetchAlbumData]);

  const handleLike = useCallback(async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!member || likeLoading) return;

    setLikeLoading(photoId);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch(`/api/portal/gallery/${photoId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? {
                  ...p,
                  likes: data.likes,
                  likedBy: data.liked
                    ? [...(p.likedBy ?? []), member.id]
                    : (p.likedBy ?? []).filter((uid: string) => uid !== member.id),
                }
              : p
          )
        );
      }
    } catch {
      // silently ignore
    } finally {
      setLikeLoading(null);
    }
  }, [member, likeLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Album not found</p>
        <button
          onClick={() => router.push('/portal/gallery')}
          className="mt-4 btn-sm btn-outline"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/portal/gallery')}
          className="group text-sm text-gray-500 hover:text-cranberry mb-4 flex items-center gap-1.5 transition-colors"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gallery
        </button>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
          {album.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} · Tap a photo to view full size, or tap ❤️ to like
        </p>
        {album.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">{album.description}</p>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl">
          <p className="text-4xl mb-3">📷</p>
          <p className="text-gray-500 dark:text-gray-400">No photos in this album yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, i) => {
            const isLiked = member ? (photo.likedBy ?? []).includes(member.id) : false;
            const likeCount = photo.likes ?? 0;

            return (
              <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {/* Photo thumbnail — click opens lightbox */}
                <button
                  onClick={() => setLightboxIndex(i)}
                  className="w-full h-full focus:outline-none focus:ring-2 focus:ring-cranberry focus:ring-offset-2 rounded-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </button>

                {/* Like button overlay — bottom-right corner */}
                <button
                  onClick={(e) => handleLike(e, photo.id)}
                  disabled={likeLoading === photo.id}
                  className={`absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all ${
                    isLiked
                      ? 'bg-cranberry text-white shadow-md shadow-cranberry/30'
                      : 'bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                  } ${isLiked ? '' : 'sm:opacity-0 sm:group-hover:opacity-100'} disabled:opacity-50`}
                  aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${likeLoading === photo.id ? 'scale-75' : isLiked ? 'scale-110' : ''}`}
                    viewBox="0 0 24 24"
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>

                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <GalleryLightbox
          images={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </div>
  );
}
