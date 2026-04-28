/**
 * Promo code / discount coupon service.
 *
 * Promo codes are stored in the `promo_codes` Firestore collection with:
 * - code: unique string (case-insensitive)
 * - eventId: event this code applies to (null = global)
 * - type: 'percent' | 'fixed' | 'free'
 * - value: discount value in cents (for fixed) or percentage (for percent)
 * - maxUses: optional cap on redemptions
 * - usedCount: tracked atomically
 * - expiresAt: optional ISO deadline
 * - minAmountCents: minimum order amount to apply
 */

import { adminDb } from '@/lib/firebase/admin';

export interface PromoCode {
  id: string;
  code: string;
  eventId: string | null;
  type: 'percent' | 'fixed' | 'free';
  value: number; // percent (e.g. 20 = 20%) or cents for fixed
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  minAmountCents: number | null;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatedPromoCode extends PromoCode {
  discountCents: number;
}

/**
 * Validate a promo code for the given event and order amount.
 * Returns the promo with computed discount, or an error string.
 */
export async function validatePromoCode(
  code: string,
  eventId: string,
  orderAmountCents: number,
): Promise<{ promo?: ValidatedPromoCode; error?: string }> {
  if (!code?.trim()) return {};

  const normalized = code.trim().toUpperCase();

  // Query by code (case-insensitive via Firestore composite index on upperCode)
  const snap = await adminDb
    .collection('promo_codes')
    .where('upperCode', '==', normalized)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) {
    return { error: 'Invalid or expired promo code.' };
  }

  const doc = snap.docs[0];
  const promo = { id: doc.id, ...doc.data() } as PromoCode;

  // Check event scope
  if (promo.eventId && promo.eventId !== eventId) {
    return { error: 'This promo code is not valid for this event.' };
  }

  // Check expiry
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { error: 'This promo code has expired.' };
  }

  // Check max uses
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { error: 'This promo code has reached its maximum number of uses.' };
  }

  // Check minimum order
  if (promo.minAmountCents != null && orderAmountCents < promo.minAmountCents) {
    return {
      error: `Minimum order of $${(promo.minAmountCents / 100).toFixed(2)} required for this code.`,
    };
  }

  // Compute discount
  let discountCents: number;
  if (promo.type === 'free') {
    discountCents = orderAmountCents; // full discount
  } else if (promo.type === 'percent') {
    discountCents = Math.round(orderAmountCents * (promo.value / 100));
  } else {
    discountCents = Math.min(promo.value, orderAmountCents); // can't discount more than total
  }

  return { promo: { ...promo, discountCents } };
}

/**
 * Atomically increment the usedCount for a promo code.
 * Returns true if the increment succeeded (code wasn't at max uses).
 */
export async function redeemPromoCode(codeId: string): Promise<boolean> {
  const ref = adminDb.collection('promo_codes').doc(codeId);

  return adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    if (!snap.exists) return false;

    const data = snap.data()!;
    const used = (data.usedCount ?? 0) + 1;

    if (data.maxUses != null && used > data.maxUses) return false;

    txn.update(ref, { usedCount: used, updatedAt: new Date().toISOString() });
    return true;
  });
}