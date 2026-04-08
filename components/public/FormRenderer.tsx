'use client';

import { useState } from 'react';
import type { FormField } from '@/types';

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (data: { answers: Record<string, any>; respondentName?: string; respondentEmail?: string }) => void;
  submitting?: boolean;
  showProgressBar?: boolean;
  allowAnonymous?: boolean;
  hideRespondentFields?: boolean;
}

export default function FormRenderer({
  fields,
  onSubmit,
  submitting = false,
  showProgressBar = true,
  allowAnonymous = true,
  hideRespondentFields = false,
}: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setValue(fieldId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!allowAnonymous && !email.trim()) {
      newErrors._email = 'Email is required';
    }

    for (const field of fields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      answers,
      respondentName: name.trim() || undefined,
      respondentEmail: email.trim() || undefined,
    });
  }

  // Progress calculation
  const answered = fields.filter((f) => {
    const val = answers[f.id];
    return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
  }).length;
  const progress = fields.length > 0 ? Math.round((answered / fields.length) * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress bar */}
      {showProgressBar && fields.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{answered} of {fields.length} answered</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-cranberry-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Respondent info */}
      {!allowAnonymous && !hideRespondentFields && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Your Information</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors._email) setErrors((prev) => { const n = { ...prev }; delete n._email; return n; });
                }}
                placeholder="you@example.com"
                className={`w-full rounded-xl border ${errors._email ? 'border-red-400' : 'border-gray-300'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
              />
              {errors._email && <p className="text-xs text-red-500 mt-1">{errors._email}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Optional name/email for anonymous forms */}
      {allowAnonymous && !hideRespondentFields && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {/* Fields */}
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={(val) => setValue(field.id, val)}
          error={errors[field.id]}
        />
      ))}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-cranberry-600 hover:bg-cranberry-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Individual Field Input ───
function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}) {
  const labelEl = (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const helperEl = field.description ? (
    <p className="text-xs text-gray-400 mt-1">{field.description}</p>
  ) : null;

  const errorEl = error ? (
    <p className="text-xs text-red-500 mt-1">{error}</p>
  ) : null;

  const inputClass = `w-full rounded-xl border ${error ? 'border-red-400' : 'border-gray-300'} bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 focus:border-cranberry-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`;

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
            value={value || ''}
            onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.min}
            max={field.max}
            className={inputClass}
          />
          {helperEl}
          {errorEl}
        </div>
      );

    case 'textarea':
      return (
        <div>
          {labelEl}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={inputClass}
          />
          {helperEl}
          {errorEl}
        </div>
      );

    case 'select':
      return (
        <div>
          {labelEl}
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((o, i) => (
              <option key={i} value={o}>{o}</option>
            ))}
          </select>
          {helperEl}
          {errorEl}
        </div>
      );

    case 'multiselect':
    case 'checkbox':
      return (
        <div>
          {labelEl}
          <div className="space-y-2 mt-1">
            {field.options?.map((o, i) => {
              const checked = Array.isArray(value) ? value.includes(o) : false;
              return (
                <label key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (checked) onChange(arr.filter((v: string) => v !== o));
                      else onChange([...arr, o]);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-cranberry-600 focus:ring-cranberry-500"
                  />
                  {o}
                </label>
              );
            })}
          </div>
          {helperEl}
          {errorEl}
        </div>
      );

    case 'radio':
      return (
        <div>
          {labelEl}
          <div className="space-y-2 mt-1">
            {field.options?.map((o, i) => (
              <label key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === o}
                  onChange={() => onChange(o)}
                  className="w-4 h-4 border-gray-300 text-cranberry-600 focus:ring-cranberry-500"
                />
                {o}
              </label>
            ))}
          </div>
          {helperEl}
          {errorEl}
        </div>
      );

    case 'rating': {
      const max = field.max || 5;
      const current = Number(value) || 0;
      return (
        <div>
          {labelEl}
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: max }, (_, i) => {
              const star = i + 1;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChange(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= current ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
          {helperEl}
          {errorEl}
        </div>
      );
    }

    case 'scale': {
      const min = field.min || 1;
      const max = field.max || 10;
      const current = value;
      return (
        <div>
          {labelEl}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 shrink-0">{min}</span>
            <div className="flex-1 flex gap-1">
              {Array.from({ length: max - min + 1 }, (_, i) => {
                const num = min + i;
                const selected = current === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChange(num)}
                    className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                      selected
                        ? 'bg-cranberry-600 text-white border-cranberry-600 font-semibold'
                        : 'border-gray-300 dark:border-gray-600 hover:border-cranberry-400 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{max}</span>
          </div>
          {helperEl}
          {errorEl}
        </div>
      );
    }

    default:
      return null;
  }
}
