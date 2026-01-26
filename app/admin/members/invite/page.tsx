'use client';

import { useState } from 'react';
import { inviteMember } from './actions';
import Link from 'next/link';

export default function AdminInviteMemberPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // TODO: Get actual admin UID from session/auth
    // For now, using a placeholder
    const adminUid = 'admin-uid'; // This should come from your auth system

    const result = await inviteMember({
      ...formData,
      adminUid,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setFormData({ email: '', firstName: '', lastName: '' });
    } else {
      setError(result.error || 'Failed to invite member');
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link 
            href="/admin/members"
            className="text-primary hover:underline text-sm font-medium"
          >
            ← Back to Members
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Invite New Member</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Send an invitation email with a secure onboarding link
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/70 dark:border-red-800/70 rounded-2xl">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/70 rounded-2xl">
              <p className="text-emerald-800 dark:text-emerald-200">
                ✓ Invitation sent successfully! The member will receive an email with onboarding instructions.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-200/70 dark:border-slate-700/70 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white/90 dark:bg-slate-900/80"
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-200/70 dark:border-slate-700/70 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white/90 dark:bg-slate-900/80"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-200/70 dark:border-slate-700/70 rounded-lg focus:ring-2 focus:ring-primary/50 bg-white/90 dark:bg-slate-900/80"
                placeholder="Doe"
              />
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-4">
              <h3 className="font-semibold text-primary dark:text-primary-300 mb-2">
                What happens next?
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Member receives an email with a secure onboarding link</li>
                <li>Member signs in and completes their profile</li>
                <li>Member pays $85 annual dues via Stripe</li>
                <li>Member gains full access to the portal</li>
              </ol>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Note: Invitation links expire after 7 days
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Onboarding Process</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Email Verification</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Member clicks the link in the email and verifies their identity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Profile Completion</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Member fills out their profile (name, bio, photo, role/company)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Dues Payment</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Secure $85 payment via Stripe Checkout
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Active Member</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Member gets full portal access and receives confirmation email
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
