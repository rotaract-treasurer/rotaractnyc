'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateToken, completeProfile, createCheckoutSession } from './actions';
import { Member } from '@/types/onboarding';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [invitationValid, setInvitationValid] = useState(false);

  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    bio: '',
    photoURL: '',
    role: '',
    company: '',
  });

  // Validate token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      const result = await validateToken(token);
      
      if (!result.success || !result.member) {
        setError(result.error || 'Invalid invitation');
        setLoading(false);
        return;
      }

      setInvitationValid(true);
      setMember(result.member);
      
      // Pre-fill name if available
      if (result.member.fullName) {
        setProfileData(prev => ({ ...prev, fullName: result.member!.fullName || '' }));
      }

      // Determine starting step based on member status
      if (result.member.status === 'PENDING_PAYMENT') {
        setStep(3);
      } else if (result.member.status === 'PENDING_PROFILE') {
        setStep(2);
      } else if (result.member.status === 'ACTIVE') {
        // Already active, redirect to portal
        router.push('/portal');
        return;
      }

      setLoading(false);
    }

    checkToken();
  }, [token, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    setError(null);

    const result = await completeProfile({
      memberId: member.id,
      ...profileData,
    });

    setLoading(false);

    if (result.success) {
      setStep(3); // Move to payment step
    } else {
      setError(result.error || 'Failed to save profile');
    }
  };

  const handlePayDues = async () => {
    if (!member) return;

    setLoading(true);
    setError(null);

    const result = await createCheckoutSession({
      memberId: member.id,
      email: member.email,
      successUrl: `${window.location.origin}/portal/onboarding/success`,
      cancelUrl: `${window.location.origin}/portal/onboarding?token=${token}`,
    });

    setLoading(false);

    if (result.success && result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } else {
      setError(result.error || 'Failed to create checkout session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!invitationValid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Invalid Invitation</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <a
              href="/contact"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              Welcome
            </span>
            <span className={step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              Profile
            </span>
            <span className={step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              Payment
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold mb-4">Welcome to Rotaract NYC!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Hi {member?.firstName}! We're excited to have you join our community.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Complete Your Membership in 2 Steps:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
                  <li>Complete your profile</li>
                  <li>Pay your $85 annual membership dues</li>
                </ol>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Get Started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tell us a bit about yourself
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Short Bio *
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="Tell us about yourself, your interests, and why you want to join Rotaract NYC..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Photo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={profileData.photoURL}
                    onChange={(e) =>
                      setProfileData({ ...profileData, photoURL: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role/Title (optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.role}
                      onChange={(e) =>
                        setProfileData({ ...profileData, role: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company (optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) =>
                        setProfileData({ ...profileData, company: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  {loading ? 'Saving...' : 'Continue to Payment →'}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Pay Membership Dues</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete your membership by paying the annual dues
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">Annual Membership Dues</span>
                  <span className="text-2xl font-bold">$85.00</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure payment powered by Stripe
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Access to all member events</li>
                <li>✓ Member directory and networking</li>
                <li>✓ Voting rights in club decisions</li>
                <li>✓ Club resources and documents</li>
              </ul>

              <button
                onClick={handlePayDues}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {loading ? 'Loading...' : 'Pay $85 with Stripe →'}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                You'll be redirected to Stripe's secure checkout page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
