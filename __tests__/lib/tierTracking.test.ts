/**
 * Tests for lib/services/tierTracking
 *
 * Key behaviours:
 *  - tryReserveTierSpot: returns true and increments when capacity available
 *  - tryReserveTierSpot: returns false when tier is at capacity
 *  - tryReserveTierSpot: handles quantity > 1 correctly
 *  - releaseTierSpot: decrements soldCount atomically, floors at 0
 *  - incrementTierSoldCount / decrementTierSoldCount: delegate to adjustTierSoldCount
 */

// Mock for Firestore transaction
const mockRunTransaction = jest.fn();
const mockTxnGet = jest.fn();
const mockTxnUpdate = jest.fn();

jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({ id: 'event-ref' }),
    }),
    runTransaction: (fn: Function) => mockRunTransaction(fn),
  },
}));

import {
  tryReserveTierSpot,
  releaseTierSpot,
  incrementTierSoldCount,
  decrementTierSoldCount,
} from '@/lib/services/tierTracking';

function makeEventDoc(tiers: Record<string, unknown>[]) {
  return {
    exists: true,
    data: () => ({ pricing: { tiers } }),
  };
}

describe('tierTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: transaction calls the callback with a mock txn object
    mockRunTransaction.mockImplementation(async (fn: Function) => {
      const txn = { get: mockTxnGet, update: mockTxnUpdate };
      return fn(txn);
    });
  });

  // ── tryReserveTierSpot ──────────────────────────────────────────────

  describe('tryReserveTierSpot', () => {
    it('returns true and increments soldCount when capacity is available', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 5, capacity: 10 }]),
      );
      const result = await tryReserveTierSpot('evt-1', 'tier-ga', 10, 1);
      expect(result).toBe(true);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ id: 'tier-ga', soldCount: 6 }),
          ]),
        }),
      );
    });

    it('returns false when tier is at capacity', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-vip', soldCount: 10, capacity: 10 }]),
      );
      const result = await tryReserveTierSpot('evt-1', 'tier-vip', 10, 1);
      expect(result).toBe(false);
      expect(mockTxnUpdate).not.toHaveBeenCalled();
    });

    it('returns false when quantity would exceed capacity', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 8, capacity: 10 }]),
      );
      const result = await tryReserveTierSpot('evt-1', 'tier-ga', 10, 3);
      expect(result).toBe(false);
      expect(mockTxnUpdate).not.toHaveBeenCalled();
    });

    it('increments by quantity (not always 1)', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 2, capacity: 50 }]),
      );
      const result = await tryReserveTierSpot('evt-1', 'tier-ga', 50, 4);
      expect(result).toBe(true);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ id: 'tier-ga', soldCount: 6 }),
          ]),
        }),
      );
    });

    it('returns false when event doc does not exist', async () => {
      mockTxnGet.mockResolvedValue({ exists: false });
      const result = await tryReserveTierSpot('evt-1', 'tier-ga', 10, 1);
      expect(result).toBe(false);
    });

    it('returns false when tier id is not found', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'other-tier', soldCount: 0, capacity: 10 }]),
      );
      const result = await tryReserveTierSpot('evt-1', 'missing-tier', 10, 1);
      expect(result).toBe(false);
    });
  });

  // ── releaseTierSpot ──────────────────────────────────────────────────

  describe('releaseTierSpot', () => {
    it('decrements soldCount by quantity', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 5 }]),
      );
      await releaseTierSpot('evt-1', 'tier-ga', 2);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ id: 'tier-ga', soldCount: 3 }),
          ]),
        }),
      );
    });

    it('floors soldCount at 0 (never goes negative)', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 1 }]),
      );
      await releaseTierSpot('evt-1', 'tier-ga', 5);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ id: 'tier-ga', soldCount: 0 }),
          ]),
        }),
      );
    });

    it('is a no-op when eventId or tierId is empty', async () => {
      await releaseTierSpot('', 'tier-ga', 1);
      await releaseTierSpot('evt-1', '', 1);
      expect(mockRunTransaction).not.toHaveBeenCalled();
    });
  });

  // ── incrementTierSoldCount / decrementTierSoldCount ──────────────────

  describe('incrementTierSoldCount', () => {
    it('increments soldCount by the given quantity', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 3 }]),
      );
      await incrementTierSoldCount('evt-1', 'tier-ga', 2);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ soldCount: 5 }),
          ]),
        }),
      );
    });
  });

  describe('decrementTierSoldCount', () => {
    it('decrements soldCount by the given quantity', async () => {
      mockTxnGet.mockResolvedValue(
        makeEventDoc([{ id: 'tier-ga', soldCount: 5 }]),
      );
      await decrementTierSoldCount('evt-1', 'tier-ga', 3);
      expect(mockTxnUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'pricing.tiers': expect.arrayContaining([
            expect.objectContaining({ soldCount: 2 }),
          ]),
        }),
      );
    });
  });
});
