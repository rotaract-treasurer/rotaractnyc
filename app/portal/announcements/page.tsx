'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  pinned?: boolean;
  audience?: 'all' | 'board' | 'members';
}

const BOARD_ROLES = ['admin', 'president', 'board', 'treasurer', 'secretary', 'vice-president'];
const ADMIN_ROLES = ['admin', 'president'];

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.34 15.84c-.196-.175-.372-.368-.527-.576A6.765 6.765 0 018.25 11.25a6.75 6.75 0 0113.5 0 6.765 6.765 0 01-1.563 4.014c-.155.208-.331.401-.527.576M10.34 15.84L8.25 21m2.09-5.16l3.66 2.1m-3.66-2.1L8.25 21m0 0h7.5M10.5 6.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function AnnouncementsPage() {
  const { user, member } = useAuth() as { user: { uid: string } | null; member: { role?: string; displayName?: string } | null };

  const role = member?.role ?? '';
  const isBoard = BOARD_ROLES.includes(role);
  const isAdmin = ADMIN_ROLES.includes(role);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compose form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'board' | 'members'>('all');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/announcements');
      if (!res.ok) throw new Error('Failed to load');
      const data: Announcement[] = await res.json();
      // Sort: pinned first, then by date desc
      const sorted = [...data].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(sorted);
    } catch {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60_000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !body.trim()) {
      setFormError('Title and message are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), audience, pinned }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to post');
      }
      setTitle('');
      setBody('');
      setAudience('all');
      setPinned(false);
      await fetchAnnouncements();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/portal/announcements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete announcement.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <MegaphoneIcon className="w-7 h-7 text-cranberry flex-shrink-0" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
      </div>

      {/* Compose form — board/admin only */}
      {isBoard && (
        <form
          onSubmit={handlePost}
          className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow-sm"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Post Announcement</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              maxLength={120}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement…"
              rows={4}
              maxLength={2000}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audience
              </label>
              <Select
                value={audience}
                onChange={(e) => setAudience(e.target.value as 'all' | 'board' | 'members')}
                disabled={submitting}
                options={[
                  { value: 'all', label: 'All Members' },
                  { value: 'members', label: 'Members Only' },
                  { value: 'board', label: 'Board Only' },
                ]}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 rounded accent-cranberry"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pin to top</span>
            </label>
          </div>

          {formError && (
            <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="bg-cranberry hover:bg-cranberry/90 text-white">
              {submitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
              {submitting ? 'Posting…' : 'Post Announcement'}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8 text-cranberry" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 dark:text-red-400 py-10">{error}</p>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-gray-400 dark:text-gray-600">
          <MegaphoneIcon className="w-16 h-16 opacity-40" />
          <p className="text-lg font-medium">No announcements yet</p>
          {isBoard && (
            <p className="text-sm">Post the first announcement above.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-cranberry/10 text-cranberry rounded-full px-2 py-0.5">
                        📌 Pinned
                      </span>
                    )}
                    {a.audience && a.audience !== 'all' && (
                      <span className="inline-flex items-center text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 capitalize">
                        {a.audience}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                    {a.createdByName} · {formatDate(a.createdAt)}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    aria-label="Delete announcement"
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
