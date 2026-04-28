/**
 * Tier sold-count tracking.
 *
 * Uses a Firestore transaction to atomically increment / decrement
 * `pricing.tiers[n].soldCount` on the event document so capacity
 * limits are enforced correctly under concurrent purchases.
 */
import { adminDb } from '@/lib/firebase/admin';

/**
 * Atomically adjust the soldCount for a specific tier on an event.
 *
 * @param eventId  Firestore event document ID
 * @param tierId   The tier's `id` field inside `pricing.tiers`
 * @param delta    +1 to increment (purchase), -1 to decrement (cancel)
 */
export async function adjustTierSoldCount(
  eventId: string,
  tierId: string,
  delta: number = 1,
): Promise<void> {
  if (!eventId || !tierId) return;

  const eventRef = adminDb.collection('events').doc(eventId);

  await adminDb.runTransaction(async (txn) => {
    const doc = await txn.get(eventRef);
    if (!doc.exists) return;

    const data = doc.data()!;
    const tiers = data.pricing?.tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) return;

    const idx = tiers.findIndex((t: any) => t.id === tierId);
    if (idx === -1) return;

    const current = tiers[idx].soldCount ?? 0;
    tiers[idx].soldCount = Math.max(0, current + delta);

    txn.update(eventRef, { 'pricing.tiers': tiers });
  });
}

/** Convenience: increment by 1 (ticket purchased). */
export const incrementTierSoldCount = (eventId: string, tierId: string) =>
  adjustTierSoldCount(eventId, tierId, 1);

/** Convenience: decrement by 1 (ticket cancelled / refunded). */
export const decrementTierSoldCount = (eventId: string, tierId: string) =>
  adjustTierSoldCount(eventId, tierId, -1);

/**
 * Atomically check capacity and reserve a spot for a tier.
 *
 * Uses a single Firestore transaction to read current soldCount, validate
 * against capacity, and increment if there is room. Returns false when the
 * tier is already full — the caller should reject the purchase.
 *
 * @returns `true` if the spot was reserved, `false` if the tier is sold out.
 */
export async function tryReserveTierSpot(
  eventId: string,
  tierId: string,
): Promise<boolean> {
  if (!eventId || !tierId) return false;

  const eventRef = adminDb.collection('events').doc(eventId);

  return adminDb.runTransaction(async (txn) => {
    const doc = await txn.get(eventRef);
    if (!doc.exists) return false;

    const data = doc.data()!;
    const tiers = data.pricing?.tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) return false;

    const idx = tiers.findIndex((t: any) => t.id === tierId);
    if (idx === -1) return false;

    const tier = tiers[idx];
    const current = tier.soldCount ?? 0;
    const capacity = tier.capacity;

    // If capacity is set and already reached, fail
    if (capacity != null && current >= capacity) return false;

    // Reserve the spot
    tiers[idx] = { ...tier, soldCount: current + 1 };

    txn.update(eventRef, { 'pricing.tiers': tiers });
    return true;
  });
}
