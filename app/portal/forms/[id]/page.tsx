'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { apiGet, apiPatch, apiDelete } from '@/hooks/useFirestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import type { CustomForm, FormField, FormFieldType, FormResponse } from '@/types';

// ─── Constants ───
const FIELD_TYPES: { value: FormFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short Text', icon: '✏️' },
  { value: 'textarea', label: 'Long Text', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'multiselect', label: 'Multi-select', icon: '☑️' },
  { value: 'radio', label: 'Single Choice', icon: '🔘' },
  { value: 'checkbox', label: 'Checkboxes', icon: '✅' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'rating', label: 'Star Rating', icon: '⭐' },
  { value: 'scale', label: 'Scale (1–10)', icon: '📊' },
];

const STATUS_COLORS: Record<string, 'green' | 'gold' | 'gray'> = {
  active: 'green',
  draft: 'gold',
  closed: 'gray',
};

function generateFieldId() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Field Editor Component ───
function FieldEditor({
  field,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(!field.label);
  const needsOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type);
  const needsRange = ['rating', 'scale', 'number'].includes(field.type);
  const typeInfo = FIELD_TYPES.find((t) => t.value === field.type);

  return (
    <Card className="p-4 border-l-4 border-l-cranberry-400">
      {/* Field header — always visible */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 cursor-grab"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
          </svg>
        </button>
        <span className="text-sm">{typeInfo?.icon}</span>
        <button
          type="button"
          className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white truncate"
          onClick={() => setExpanded(!expanded)}
        >
          {field.label || <span className="text-gray-400 italic">Untitled field</span>}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </button>
        <span className="text-xs text-gray-400 shrink-0">{typeInfo?.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="mt-4 space-y-3 pl-7">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Label"
              required
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              placeholder="e.g., How would you rate this event?"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Field Type
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                value={field.type}
                onChange={(e) =>
                  onChange({
                    ...field,
                    type: e.target.value as FormFieldType,
                    options: ['select', 'multiselect', 'radio', 'checkbox'].includes(e.target.value)
                      ? field.options || ['Option 1']
                      : undefined,
                    min: ['rating', 'scale', 'number'].includes(e.target.value) ? 1 : undefined,
                    max: e.target.value === 'rating' ? 5 : e.target.value === 'scale' ? 10 : undefined,
                  })
                }
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Placeholder (optional)"
            value={field.placeholder || ''}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            placeholder="Placeholder text shown in the input"
          />

          <Input
            label="Helper Text (optional)"
            value={field.description || ''}
            onChange={(e) => onChange({ ...field, description: e.target.value })}
            placeholder="Extra instructions for the respondent"
          />

          {/* Options for select/radio/checkbox */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Options
              </label>
              <div className="space-y-2">
                {(field.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const updated = [...(field.options || [])];
                        updated[i] = e.target.value;
                        onChange({ ...field, options: updated });
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (field.options || []).filter((_, j) => j !== i);
                        onChange({ ...field, options: updated });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...field,
                      options: [...(field.options || []), `Option ${(field.options || []).length + 1}`],
                    })
                  }
                  className="text-sm text-cranberry-600 hover:text-cranberry-700 font-medium"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {/* Range for rating/scale/number */}
          {needsRange && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min"
                type="number"
                value={String(field.min ?? 1)}
                onChange={(e) => onChange({ ...field, min: Number(e.target.value) })}
              />
              <Input
                label="Max"
                type="number"
                value={String(field.max ?? (field.type === 'rating' ? 5 : 10))}
                onChange={(e) => onChange({ ...field, max: Number(e.target.value) })}
              />
            </div>
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
          </label>
        </div>
      )}
    </Card>
  );
}

// ─── Response Viewer ───
function ResponsesView({ formId, fields }: { formId: string; fields: FormField[] }) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [formId]);

  async function fetchResponses() {
    setLoading(true);
    try {
      const data = await apiGet(`/api/portal/forms/${formId}/responses`);
      setResponses(data.responses || []);
    } catch {
      toast('Failed to load responses', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteResponse(responseId: string) {
    try {
      await apiDelete(`/api/portal/forms/${formId}/responses?responseId=${responseId}`);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      toast('Response deleted');
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function exportCSV() {
    if (responses.length === 0) return;

    const headers = [
      'Submitted',
      'Name',
      'Email',
      ...fields.map((f) => f.label),
    ];

    const rows = responses.map((r) => [
      new Date(r.submittedAt).toLocaleString(),
      r.respondentName || '—',
      r.respondentEmail || '—',
      ...fields.map((f) => {
        const val = r.answers?.[f.id];
        if (val === undefined || val === null) return '';
        if (Array.isArray(val)) return val.join('; ');
        return String(val);
      }),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-responses-${formId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        }
        title="No responses yet"
        description="Share the form link to start collecting responses."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {responses.length} response{responses.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" variant="secondary" onClick={exportCSV}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respondent</th>
              {fields.map((f) => (
                <th key={f.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase max-w-[200px] truncate">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {responses.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(r.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {r.respondentName || '—'}
                  </div>
                  {r.respondentEmail && (
                    <div className="text-xs text-gray-400">{r.respondentEmail}</div>
                  )}
                </td>
                {fields.map((f) => {
                  const val = r.answers?.[f.id];
                  let display = '—';
                  if (val !== undefined && val !== null && val !== '') {
                    if (Array.isArray(val)) display = val.join(', ');
                    else if (f.type === 'rating') display = '⭐'.repeat(Number(val));
                    else display = String(val);
                  }
                  return (
                    <td key={f.id} className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                      {display}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDeleteResponse(r.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete response"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { member, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [showAddField, setShowAddField] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isAdmin = member && ['board', 'president', 'treasurer'].includes(member.role);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchForm();
  }, [authLoading, isAdmin, id]);

  async function fetchForm() {
    setLoading(true);
    try {
      const data = await apiGet(`/api/portal/forms/${id}`);
      setForm(data);
    } catch {
      toast('Failed to load form', 'error');
    } finally {
      setLoading(false);
    }
  }

  const updateForm = useCallback(
    (updates: Partial<CustomForm>) => {
      setForm((prev) => (prev ? { ...prev, ...updates } : prev));
      setHasChanges(true);
    },
    [],
  );

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await apiPatch(`/api/portal/forms/${id}`, {
        title: form.title,
        description: form.description,
        fields: form.fields,
        settings: form.settings,
        status: form.status,
        linkedEventId: form.linkedEventId,
        closesAt: form.closesAt,
      });
      toast('Form saved!');
      setHasChanges(false);
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  function addField(type: FormFieldType) {
    if (!form) return;
    const newField: FormField = {
      id: generateFieldId(),
      type,
      label: '',
      required: false,
      order: form.fields.length,
      ...((['select', 'multiselect', 'radio', 'checkbox'].includes(type))
        ? { options: ['Option 1', 'Option 2'] }
        : {}),
      ...(type === 'rating' ? { min: 1, max: 5 } : {}),
      ...(type === 'scale' ? { min: 1, max: 10 } : {}),
    };
    updateForm({ fields: [...form.fields, newField] });
    setShowAddField(false);
  }

  function updateField(fieldId: string, updated: FormField) {
    if (!form) return;
    updateForm({
      fields: form.fields.map((f) => (f.id === fieldId ? updated : f)),
    });
  }

  function deleteField(fieldId: string) {
    if (!form) return;
    updateForm({
      fields: form.fields.filter((f) => f.id !== fieldId),
    });
  }

  function moveField(index: number, direction: 'up' | 'down') {
    if (!form) return;
    const fields = [...form.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= fields.length) return;
    [fields[index], fields[swapIndex]] = [fields[swapIndex], fields[index]];
    updateForm({ fields: fields.map((f, i) => ({ ...f, order: i })) });
  }

  function getShareUrl() {
    if (!form) return '';
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form.slug}`;
  }

  function copyLink() {
    navigator.clipboard.writeText(getShareUrl());
    toast('Link copied!');
  }

  async function toggleStatus() {
    if (!form) return;
    const newStatus = form.status === 'active' ? 'closed' : 'active';
    updateForm({ status: newStatus });
    // Auto-save on status toggle
    setSaving(true);
    try {
      await apiPatch(`/api/portal/forms/${id}`, { status: newStatus });
      toast(newStatus === 'active' ? 'Form is now live!' : 'Form closed');
      setHasChanges(false);
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Not Found</h1>
        <Button variant="ghost" onClick={() => router.push('/portal/forms')}>
          ← Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/portal/forms')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                className="font-display text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="Form title..."
              />
              <Badge variant={STATUS_COLORS[form.status] || 'gray'}>{form.status}</Badge>
            </div>
            {form.status === 'active' && (
              <button
                onClick={copyLink}
                className="text-xs text-cranberry-600 hover:text-cranberry-700 flex items-center gap-1 mt-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {getShareUrl()}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          <Button
            size="sm"
            variant={form.status === 'active' ? 'secondary' : 'primary'}
            onClick={toggleStatus}
          >
            {form.status === 'active' ? '⏸ Close' : '🚀 Publish'}
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={!hasChanges}>
            Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'builder', label: `Fields (${form.fields.length})` },
          { id: 'responses', label: `Responses (${form.responseCount || 0})` },
          { id: 'preview', label: 'Preview' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-3">
          {/* Description */}
          <Card className="p-4">
            <Textarea
              label="Form Description"
              value={form.description || ''}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="Brief description shown to respondents... (optional)"
              rows={2}
            />
          </Card>

          {/* Fields */}
          {form.fields.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-3">No fields yet. Add your first field to get started.</p>
              <Button onClick={() => setShowAddField(true)}>
                + Add Field
              </Button>
            </Card>
          ) : (
            <>
              {form.fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  total={form.fields.length}
                  onChange={(updated) => updateField(field.id, updated)}
                  onDelete={() => deleteField(field.id)}
                  onMoveUp={() => moveField(index, 'up')}
                  onMoveDown={() => moveField(index, 'down')}
                />
              ))}
              <button
                onClick={() => setShowAddField(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-cranberry-400 hover:text-cranberry-600 transition-colors"
              >
                + Add Field
              </button>
            </>
          )}
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <ResponsesView formId={id} fields={form.fields} />
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <Card className="p-6 max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">
            {form.title}
          </h2>
          {form.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{form.description}</p>
          )}
          <div className="space-y-5">
            {form.fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
          {form.fields.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button disabled className="w-full sm:w-auto">Submit (Preview)</Button>
            </div>
          )}
        </Card>
      )}

      {/* Add Field Picker Modal */}
      <Modal open={showAddField} onClose={() => setShowAddField(false)} title="Add Field">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FIELD_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => addField(type.value)}
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-cranberry-400 hover:bg-cranberry-50/50 dark:hover:bg-cranberry-900/10 transition-all text-left"
            >
              <span className="text-2xl block mb-1">{type.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Form Settings">
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Require login to submit</p>
              <p className="text-xs text-gray-500">Respondents must sign in with their member account</p>
            </div>
            <input
              type="checkbox"
              checked={form.settings.requireLogin ?? false}
              onChange={(e) =>
                updateForm({
                  settings: {
                    ...form.settings,
                    requireLogin: e.target.checked,
                    // If requiring login, anonymous doesn't apply
                    ...(e.target.checked ? { allowAnonymous: true } : {}),
                  },
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
            />
          </label>

          {!form.settings.requireLogin && (
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow anonymous responses</p>
                <p className="text-xs text-gray-500">Don&apos;t require name/email to submit</p>
              </div>
              <input
                type="checkbox"
                checked={form.settings.allowAnonymous}
                onChange={(e) =>
                  updateForm({
                    settings: { ...form.settings, allowAnonymous: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
              />
            </label>
          )}

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Limit one response per person</p>
              <p className="text-xs text-gray-500">{form.settings.requireLogin ? 'Based on member account' : 'Based on email address'}</p>
            </div>
            <input
              type="checkbox"
              checked={form.settings.limitOneResponse}
              onChange={(e) =>
                updateForm({
                  settings: { ...form.settings, limitOneResponse: e.target.checked },
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
            />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Show progress bar</p>
              <p className="text-xs text-gray-500">Show respondents how many fields remain</p>
            </div>
            <input
              type="checkbox"
              checked={form.settings.showProgressBar}
              onChange={(e) =>
                updateForm({
                  settings: { ...form.settings, showProgressBar: e.target.checked },
                })
              }
              className="w-4 h-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
            />
          </label>

          <Textarea
            label="Confirmation Message"
            value={form.settings.confirmationMessage}
            onChange={(e) =>
              updateForm({
                settings: { ...form.settings, confirmationMessage: e.target.value },
              })
            }
            placeholder="Thank you for your response!"
            rows={2}
          />

          <Input
            label="Redirect URL (optional)"
            type="url"
            value={form.settings.redirectUrl || ''}
            onChange={(e) =>
              updateForm({
                settings: { ...form.settings, redirectUrl: e.target.value },
              })
            }
            placeholder="https://rotaractnyc.org/events"
          />

          <Input
            label="Auto-close Date (optional)"
            type="datetime-local"
            value={form.closesAt ? form.closesAt.slice(0, 16) : ''}
            onChange={(e) =>
              updateForm({ closesAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
          />

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowSettings(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Preview Field ───
function PreviewField({ field }: { field: FormField }) {
  const labelEl = (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {field.label || 'Untitled'}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const helperEl = field.description ? (
    <p className="text-xs text-gray-400 mt-1">{field.description}</p>
  ) : null;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
    case 'date':
      return (
        <div>
          {labelEl}
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            disabled
            placeholder={field.placeholder || ''}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
          {helperEl}
        </div>
      );

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            disabled
            placeholder={field.placeholder || ''}
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
          {helperEl}
        </div>
      );

    case 'select':
      return (
        <div>
          {labelEl}
          <select disabled className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700">
            <option>{field.placeholder || 'Select...'}</option>
            {field.options?.map((o, i) => <option key={i}>{o}</option>)}
          </select>
          {helperEl}
        </div>
      );

    case 'multiselect':
    case 'checkbox':
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {field.options?.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300" />
                {o}
              </label>
            ))}
          </div>
          {helperEl}
        </div>
      );

    case 'radio':
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {field.options?.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" disabled name={field.id} className="w-4 h-4 border-gray-300" />
                {o}
              </label>
            ))}
          </div>
          {helperEl}
        </div>
      );

    case 'rating':
      return (
        <div>
          {labelEl}
          <div className="flex gap-1">
            {Array.from({ length: field.max || 5 }, (_, i) => (
              <span key={i} className="text-2xl text-gray-300">⭐</span>
            ))}
          </div>
          {helperEl}
        </div>
      );

    case 'scale':
      return (
        <div>
          {labelEl}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{field.min || 1}</span>
            <div className="flex-1 flex gap-1">
              {Array.from(
                { length: (field.max || 10) - (field.min || 1) + 1 },
                (_, i) => (
                  <button
                    key={i}
                    disabled
                    className="flex-1 py-2 text-xs rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                  >
                    {(field.min || 1) + i}
                  </button>
                ),
              )}
            </div>
            <span className="text-xs text-gray-400">{field.max || 10}</span>
          </div>
          {helperEl}
        </div>
      );

    default:
      return null;
  }
}
