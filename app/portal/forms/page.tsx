'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { apiGet, apiPost, apiDelete } from '@/hooks/useFirestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import type { CustomForm } from '@/types';

const STATUS_COLORS: Record<string, 'green' | 'gold' | 'gray'> = {
  active: 'green',
  draft: 'gold',
  closed: 'gray',
};

export default function FormsPage() {
  const { member, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
  });

  const isAdmin = member && ['board', 'president', 'treasurer'].includes(member.role);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    fetchForms();
  }, [authLoading, isAdmin]);

  async function fetchForms() {
    setLoading(true);
    try {
      const data = await apiGet('/api/portal/forms');
      setForms(Array.isArray(data) ? data : []);
    } catch {
      toast('Failed to load forms', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.title.trim()) return;
    setCreating(true);
    try {
      const created = await apiPost('/api/portal/forms', {
        title: newForm.title,
        description: newForm.description,
        status: 'draft',
        fields: [],
        settings: {
          allowAnonymous: true,
          requireLogin: false,
          limitOneResponse: false,
          showProgressBar: true,
          confirmationMessage: 'Thank you for your response!',
        },
      });
      toast('Form created! Now add your fields.');
      setShowCreate(false);
      setNewForm({ title: '', description: '' });
      router.push(`/portal/forms/${created.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to create form', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/portal/forms/${deleteId}`);
      setForms((prev) => prev.filter((f) => f.id !== deleteId));
      toast('Form deleted');
      setDeleteId(null);
    } catch {
      toast('Failed to delete form', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function getShareUrl(slug: string) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${slug}`;
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(getShareUrl(slug));
    toast('Link copied to clipboard!');
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500">You need admin access to manage forms.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Forms & Surveys
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create custom forms, collect responses, and export data — no Google Forms needed.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Form
        </Button>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          }
          title="No forms yet"
          description="Create your first form or survey to start collecting data."
          action={
            <Button onClick={() => setShowCreate(true)}>Create First Form</Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-display font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-cranberry-600 transition-colors"
                      onClick={() => router.push(`/portal/forms/${form.id}`)}
                    >
                      {form.title}
                    </h3>
                    <Badge variant={STATUS_COLORS[form.status] || 'gray'}>
                      {form.status}
                    </Badge>
                  </div>
                  {form.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{form.fields?.length || 0} field{(form.fields?.length || 0) !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{form.responseCount || 0} response{(form.responseCount || 0) !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                    {form.closesAt && (
                      <>
                        <span>•</span>
                        <span>Closes {new Date(form.closesAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {form.status === 'active' && (
                    <button
                      onClick={() => copyLink(form.slug)}
                      className="p-2 text-gray-400 hover:text-cranberry-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Copy shareable link"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/portal/forms/${form.id}`)}
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => setDeleteId(form.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    title="Delete form"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Form">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Form Title"
            required
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="e.g., Post-Event Survey — Spring Gala 2026"
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            placeholder="Brief description shown to respondents..."
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create & Add Fields
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Form?">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will permanently delete the form and all its responses. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete Form
          </Button>
        </div>
      </Modal>
    </div>
  );
}
