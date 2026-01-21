'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseClientApp } from '@/lib/firebase/client';

interface PostComposerProps {
  onPostCreated?: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'community' | 'announcement'>('community');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canPostAnnouncement = useMemo(() => {
    const role = userData?.role;
    return role === 'BOARD' || role === 'TREASURER' || role === 'ADMIN';
  }, [userData?.role]);

  const close = () => {
    setOpen(false);
    setSubmitting(false);
    setTitle('');
    setBody('');
    setMode('community');
  };

  const submit = async () => {
    if (!user?.uid) return;
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    if (trimmedBody.length > 2000) {
      alert('Post is too long. Please keep it under 2000 characters.');
      return;
    }
    if (mode === 'announcement' && !canPostAnnouncement) return;
    if (mode === 'announcement' && !title.trim()) return;

    const app = getFirebaseClientApp();
    if (!app) return;
    const db = getFirestore(app);

    setSubmitting(true);
    try {
      const authorName = userData?.name || user.displayName || 'Member';
      const authorRole = userData?.role ? String(userData.role) : 'MEMBER';
      const authorPhotoURL = userData?.photoURL || user.photoURL || null;

      if (mode === 'announcement') {
        await addDoc(collection(db, 'announcements'), {
          title: title.trim(),
          body: trimmedBody,
          pinned: false,
          visibility: 'member',
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          seeded: false,
        });
      } else {
        await addDoc(collection(db, 'communityPosts'), {
          authorUid: user.uid,
          authorName,
          authorRole,
          authorPhotoURL,
          title: null,
          body: trimmedBody,
          type: 'text',
          images: null,
          document: null,
          likesCount: 0,
          commentsCount: 0,
          createdAt: serverTimestamp(),
        });
      }

      close();
      onPostCreated?.();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to post. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] flex gap-4 items-center">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Current user avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined">person</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left bg-[#f5f5f7] dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 py-2.5 px-4 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
        >
          Share an update with the club...
        </button>
      </div>
    </div>

    {open ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => (submitting ? null : close())}
        />
        <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] shadow-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary dark:text-white">Create Post</h2>
            <button
              onClick={() => (submitting ? null : close())}
              className="text-gray-400 hover:text-primary dark:hover:text-white"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {canPostAnnouncement && (
            <div className="mt-4 flex gap-2 bg-gray-50 dark:bg-[#141414] p-1 rounded-lg">
              <button
                onClick={() => setMode('community')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  mode === 'community'
                    ? 'bg-white dark:bg-[#2a2a2a] text-primary dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base mr-1 align-middle">forum</span>
                Update
              </button>
              <button
                onClick={() => setMode('announcement')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  mode === 'announcement'
                    ? 'bg-white dark:bg-[#2a2a2a] text-primary dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base mr-1 align-middle">campaign</span>
                Announcement
              </button>
            </div>
          )}

          {!canPostAnnouncement && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
              Your updates are visible to all members. Announcements require board access.
            </p>
          )}

          {mode === 'announcement' && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="material-symbols-outlined text-base align-middle mr-1">title</span>
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g., Important Meeting Change"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span className="material-symbols-outlined text-base align-middle mr-1">
                {mode === 'announcement' ? 'description' : 'chat'}
              </span>
              {mode === 'announcement' ? 'Message' : 'Update'}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[140px] px-4 py-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder={mode === 'announcement' ? 'Share important news with all members...' : 'What\'s on your mind? Share updates, ideas, or questions...'}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                {body.length} / 2000 characters
              </p>
              {mode === 'announcement' && (
                <span className="text-xs font-semibold text-primary">
                  Visible to all members
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
            <button
              onClick={() => (submitting ? null : close())}
              className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !body.trim() || body.length > 2000 || (mode === 'announcement' && (!canPostAnnouncement || !title.trim()))}
              className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Posting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Post {mode === 'announcement' ? 'Announcement' : 'Update'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
