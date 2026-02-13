'use client';

import { useAuth } from '@/lib/firebase/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SITE } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/format';

export default function DuesPage() {
  const { member } = useAuth();

  // Sample dues data
  const currentCycle = {
    name: '2025-2026',
    startDate: '2025-07-01',
    endDate: '2026-06-30',
  };

  const duesStatus: string = 'UNPAID'; // UNPAID | PAID | WAIVED
  const memberType = member?.memberType || 'professional';
  const amount = memberType === 'student' ? SITE.dues.student : SITE.dues.professional;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Annual Dues</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your membership dues for the current Rotary year.</p>
      </div>

      {/* Status Card */}
      <Card padding="lg">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Rotary Year {currentCycle.name}
          </p>
          <Badge
            variant={duesStatus === 'PAID' ? 'green' : duesStatus === 'WAIVED' ? 'azure' : 'red'}
            className="text-sm px-4 py-1"
          >
            {duesStatus === 'PAID' ? '✓ Paid' : duesStatus === 'WAIVED' ? 'Waived' : 'Unpaid'}
          </Badge>
        </div>

        {duesStatus === 'UNPAID' && (
          <div className="mt-8 space-y-6">
            {/* Pricing */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button className="p-5 rounded-xl border-2 border-cranberry bg-cranberry-50/50 dark:bg-cranberry-900/10 text-left transition-all">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Professional</p>
                <p className="text-3xl font-display font-bold text-cranberry mt-1">{formatCurrency(SITE.dues.professional)}</p>
                <p className="text-xs text-gray-500 mt-1">For working professionals</p>
              </button>
              <button className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-cranberry text-left transition-all">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Student</p>
                <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(SITE.dues.student)}</p>
                <p className="text-xs text-gray-500 mt-1">Valid student ID required</p>
              </button>
            </div>

            <Button size="lg" className="w-full">
              Pay {formatCurrency(amount)} via Stripe
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Secure payment powered by Stripe. Includes Rotary International registration.
            </p>
          </div>
        )}

        {duesStatus === 'PAID' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your dues for {currentCycle.name} have been paid. Thank you! 🎉
            </p>
          </div>
        )}
      </Card>

      {/* Info */}
      <Card padding="md">
        <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">About Annual Dues</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cranberry mt-0.5">•</span>
            The Rotary year runs July 1 – June 30
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cranberry mt-0.5">•</span>
            Dues include Rotary International membership registration
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cranberry mt-0.5">•</span>
            There is a 30-day grace period after the cycle ends
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cranberry mt-0.5">•</span>
            Contact your treasurer for payment questions or alternative arrangements
          </li>
        </ul>
      </Card>
    </div>
  );
}
