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

/** Convenience: increment by `quantity` (ticket purchased). */
export const incrementTierSoldCount = (eventId: string, tierId: string, quantity: number = 1) =>
  adjustTierSoldCount(eventId, tierId, quantity);

/** Convenience: decrement by `quantity` (ticket cancelled / refunded). */
export const decrementTierSoldCount = (eventId: string, tierId: string, quantity: number = 1) =>
  adjustTierSoldCount(eventId, tierId, -quantity);

/**
 * Atomically check capacity and reserve spots for a tier.
 *
 * Uses a single Firestore transaction to read current soldCount, validate
 * against capacity, and increment if there is room. Returns false when the
 * tier is already full — the caller should reject the purchase.
 *
 * @param quantity  Number of spots to reserve (default 1)
 * @returns `true` if the spots were reserved, `false` if the tier is sold out.
 */
export async function tryReserveTierSpot(
  eventId: string,
  tierId: string,
  capacity?: number,
  quantity: number = 1,
): Promise<boolean> {
  if (!eventId || !tierId) return false;
  const qty = Math.max(1, quantity);

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
    const cap = capacity ?? tier.capacity;

    // If capacity is set and already reached, fail
    if (cap != null && current + qty > cap) return false;

    // Reserve the spots
    tiers[idx] = { ...tier, soldCount: current + qty };

    txn.update(eventRef, { 'pricing.tiers': tiers });
    return true;
  });
}

/**
 * Atomically release previously reserved tier spots.
 * Used when a checkout fails after reservation (e.g., unauthenticated user).
 */
export async function releaseTierSpot(
  eventId: string,
  tierId: string,
  quantity: number = 1,
): Promise<void> {
  if (!eventId || !tierId) return;
  const qty = Math.max(1, quantity);

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
    tiers[idx] = { ...tiers[idx], soldCount: Math.max(0, current - qty) };

    txn.update(eventRef, { 'pricing.tiers': tiers });
  });
}
