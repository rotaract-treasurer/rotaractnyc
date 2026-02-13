'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SITE } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils/format';
import type { DuesPaymentStatus } from '@/types';

interface DuesBannerProps {
  status: DuesPaymentStatus;
  cycleName?: string;
  className?: string;
}

export default function DuesBanner({ status, cycleName = '2025-2026', className }: DuesBannerProps) {
  if (status === 'PAID' || status === 'PAID_OFFLINE' || status === 'WAIVED') return null;

  return (
    <div className={`bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 rounded-xl p-4 flex items-center justify-between gap-4 ${className || ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">💳</span>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Dues Unpaid — {cycleName}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Please pay your annual dues ({formatCurrency(SITE.dues.professional)} professional / {formatCurrency(SITE.dues.student)} student) to maintain active status.
          </p>
        </div>
      </div>
      <Link href="/portal/dues">
        <Button size="sm" variant="gold">Pay Now</Button>
      </Link>
    </div>
  );
}
