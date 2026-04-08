'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import FormRenderer from '@/components/public/FormRenderer';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import type { CustomForm } from '@/types';

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, member, loading: authLoading, signInWithGoogle } = useAuth();
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [slug]);

  async function fetchForm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${slug}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Form not found');
        return;
      }
      const data = await res.json();
      setForm(data);
    } catch {
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: { answers: Record<string, any>; respondentName?: string; respondentEmail?: string }) {
    setSubmitting(true);
    try {
      // Auto-fill respondent info from authenticated user when requireLogin is on
      const submitData = { ...data };
      if (form?.settings?.requireLogin && user) {
        submitData.respondentName = member?.displayName || user.displayName || undefined;
        submitData.respondentEmail = (member as any)?.email || user.email || undefined;
      }

      const res = await fetch(`/api/forms/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Failed to submit');
        return;
      }

      setConfirmationMessage(result.confirmationMessage || 'Thank you for your response!');

      if (result.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2000);
      }

      setSubmitted(true);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error / closed
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-4xl mb-4">📋</div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error === 'Form not found' ? 'Form Not Found' : 'Form Unavailable'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error === 'Form not found'
              ? "This form doesn't exist or may have been removed."
              : error}
          </p>
        </div>
      </div>
    );
  }

  // Submitted
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">
            Response Recorded
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {confirmationMessage}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setConfirmationMessage('');
            }}
            className="mt-6 text-sm text-cranberry-600 hover:text-cranberry-700 font-medium"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // ── Login gate for forms that require authentication ──
  const requiresLogin = form.settings?.requireLogin;
  const isLoggedIn = !!user;

  if (requiresLogin && !isLoggedIn) {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">
            Login Required
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span className="font-medium text-gray-700 dark:text-gray-300">{form.title}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You need to sign in with your member account to submit this form.
          </p>
          <Button
            onClick={async () => {
              setSigningIn(true);
              try { await signInWithGoogle(); } catch { /* handled by auth */ }
              finally { setSigningIn(false); }
            }}
            loading={signingIn}
            className="w-full sm:w-auto"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        {/* Logged-in badge for login-required forms */}
        {requiresLogin && isLoggedIn && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs text-green-700 dark:text-green-400">
              Submitting as <strong>{member?.displayName || user?.displayName || user?.email}</strong>
            </span>
          </div>
        )}

        {/* Form header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {form.description}
            </p>
          )}
          {form.closesAt && (
            <p className="text-xs text-gray-400 mt-2">
              Closes {new Date(form.closesAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        <FormRenderer
          fields={form.fields}
          onSubmit={handleSubmit}
          submitting={submitting}
          showProgressBar={form.settings?.showProgressBar}
          allowAnonymous={requiresLogin ? true : form.settings?.allowAnonymous}
          hideRespondentFields={requiresLogin && isLoggedIn}
        />
      </div>

      {/* Powered by branding */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Powered by{' '}
        <a href="/" className="text-cranberry-600 hover:text-cranberry-700">
          Rotaract NYC
        </a>
      </p>
    </div>
  );
}
