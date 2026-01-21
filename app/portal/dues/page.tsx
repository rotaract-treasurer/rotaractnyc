'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DuesBanner from '@/components/portal/DuesBanner';

interface DuesCycle {
  id: string;
  label: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface MemberDues {
  status: string;
  paidAt?: any;
  paidOfflineAt?: any;
  waivedAt?: any;
  amount?: number;
  stripeSessionId?: string;
}

export default function PortalDuesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeCycle, setActiveCycle] = useState<DuesCycle | null>(null);
  const [memberDues, setMemberDues] = useState<MemberDues | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/portal/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadDuesStatus();
    }
  }, [user]);

  async function loadDuesStatus() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/portal/dues-status?memberId=${user.uid}`);
      if (!response.ok) {
        throw new Error('Failed to load dues status');
      }

      const data = await response.json();
      setActiveCycle(data.cycle);
      setMemberDues(data.memberDues);
    } catch (err: any) {
      console.error('Error loading dues status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayNow() {
    if (!activeCycle || !user) return;

    try {
      setPaymentLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const baseUrl = window.location.origin;

      const response = await fetch('/api/stripe/checkout/dues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user.uid,
          cycleId: activeCycle.id,
          email: user.email,
          successUrl: `${baseUrl}/portal/dues?success=true`,
          cancelUrl: `${baseUrl}/portal/dues?canceled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific error messages
        if (data.error && data.error.includes('Stripe is not configured')) {
          throw new Error('Online payment is temporarily unavailable. Please contact the board at board@rotaractnewyork.org to arrange payment.');
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message);
      setPaymentLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPaid = memberDues && ['PAID', 'PAID_OFFLINE', 'WAIVED'].includes(memberDues.status);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-navy dark:text-white mb-2">
            Annual Membership Dues
          </h1>
          <p className="text-navy/60 dark:text-white/60">
            Your dues support local service projects, professional development, and club operations.
          </p>
        </div>

        {/* Alert Messages */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === 'true' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <p className="text-green-800 dark:text-green-200 font-medium">
                Payment successful! Thank you for your dues payment.
              </p>
            </div>
          </div>
        )}

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('canceled') === 'true' && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-600">info</span>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Payment was canceled. You can try again below.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Current Status Card */}
        {!activeCycle && !loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-6">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-blue-600 text-3xl">info</span>
              <div>
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  No Active Dues Cycle
                </h2>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  There is currently no active dues cycle. The board will notify members when dues payments open.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Questions? Contact{' '}
                  <a href="mailto:board@rotaractnewyork.org" className="font-medium underline hover:no-underline">
                    board@rotaractnewyork.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeCycle && (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">
                  {activeCycle.label}
                </h2>
                <p className="text-navy/60 dark:text-white/60">
                  {new Date(activeCycle.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(activeCycle.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-navy dark:text-white">
                  ${(activeCycle.amount / 100).toFixed(2)}
                </div>
                <p className="text-sm text-navy/60 dark:text-white/60">Annual Dues</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              {isPaid ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                  <span className="font-bold text-green-800 dark:text-green-200">
                    {memberDues.status === 'WAIVED' ? 'Waived' : 'Paid'}
                  </span>
                  {memberDues.paidAt && (
                    <span className="text-sm text-green-700 dark:text-green-300">
                      on {new Date(memberDues.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <span className="material-symbols-outlined text-yellow-600 text-lg">schedule</span>
                  <span className="font-bold text-yellow-800 dark:text-yellow-200">Payment Pending</span>
                </div>
              )}
            </div>

            {/* Pay Button */}
            {!isPaid && (
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-navy font-extrabold rounded-xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">credit_card</span>
                    Pay ${(activeCycle.amount / 100).toFixed(2)} Now
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* What Your Dues Support */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2a2a] p-8">
          <h3 className="text-xl font-bold text-navy dark:text-white mb-6">
            Where Your Dues Go
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">volunteer_activism</span>
              </div>
              <div>
                <h4 className="font-bold text-navy dark:text-white mb-1">Local Service Projects</h4>
                <p className="text-sm text-navy/60 dark:text-white/60">
                  Feeding New Yorkers, school supply drives, and environmental cleanup across the five boroughs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">public</span>
              </div>
              <div>
                <h4 className="font-bold text-navy dark:text-white mb-1">District & Rotary International</h4>
                <p className="text-sm text-navy/60 dark:text-white/60">
                  Required insurance, international affiliation, and regional leadership conferences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div>
                <h4 className="font-bold text-navy dark:text-white mb-1">Professional Development</h4>
                <p className="text-sm text-navy/60 dark:text-white/60">
                  Workshop materials, venue rentals for guest speakers, and club networking events.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
            <p className="text-sm text-navy/60 dark:text-white/60">
              Questions about dues? Contact the board at{' '}
              <a href="mailto:board@rotaractnewyork.org" className="text-primary font-medium hover:underline">
                board@rotaractnewyork.org
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
