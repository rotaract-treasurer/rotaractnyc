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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/admin/members"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Members
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Invite New Member</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Send an invitation email with a secure onboarding link
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                ✓ Invitation sent successfully! The member will receive an email with onboarding instructions.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="Doe"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Member receives an email with a secure onboarding link</li>
                <li>Member signs in and completes their profile</li>
                <li>Member pays $85 annual dues via Stripe</li>
                <li>Member gains full access to the portal</li>
              </ol>
              <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                Note: Invitation links expire after 7 days
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-3">Onboarding Process</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Email Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Member clicks the link in the email and verifies their identity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Profile Completion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Member fills out their profile (name, bio, photo, role/company)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Dues Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure $85 payment via Stripe Checkout
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Active Member</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
