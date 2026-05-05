/**
 * Tests for lib/services/weeklyEventDigest
 *
 * Focus: isoWeek helper + delta logic. Doesn't actually render PDFs.
 */

const mockGetEventAttendees = jest.fn();
const mockRenderPDF = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@/lib/services/eventAttendees', () => ({
  getEventAttendees: (...args: any[]) => mockGetEventAttendees(...args),
}));

jest.mock('@/lib/pdf/renderEventAttendeesPDF', () => ({
  renderEventAttendeesPDF: (...args: any[]) => mockRenderPDF(...args),
}));

jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

jest.mock('@/lib/firebase/admin', () => {
  const state: {
    events: any[];
    members: any[];
    notification_preferences: Record<string, any>;
    digest_snapshots: Record<string, any>;
    activity_logs: any[];
  } = {
    events: [],
    members: [],
    notification_preferences: {},
    digest_snapshots: {},
    activity_logs: [],
  };

  function makeQuery(collectionName: string) {
    let filters: Array<{ field: string; op: string; value: any }> = [];
    const query: any = {
      where(field: string, op: string, value: any) {
        filters.push({ field, op, value });
        return query;
      },
      get: jest.fn(async () => {
        let items = (state as any)[collectionName] ?? [];
        for (const f of filters) {
          items = items.filter((item: any) => {
            const val = item[f.field];
            if (f.op === '==') return val === f.value;
            if (f.op === 'in') return (f.value as any[]).includes(val);
            if (f.op === '>=') return val >= f.value;
            if (f.op === '<=') return val <= f.value;
            return true;
          });
        }
        return {
          docs: items.map((item: any) => ({
            id: item.id,
            data: () => item,
          })),
          size: items.length,
          empty: items.length === 0,
        };
      }),
    };
    return query;
  }

  const adminDb: any = {
    collection: jest.fn((name: string) => ({
      ...makeQuery(name),
      doc: jest.fn((id: string) => ({
        get: jest.fn(async () => {
          const bucket = (state as any)[name];
          if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
            const data = bucket[id];
            return {
              exists: !!data,
              data: () => data,
            };
          }
          return { exists: false, data: () => undefined };
        }),
        set: jest.fn(async (data: any) => {
          const bucket = (state as any)[name];
          if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
            bucket[id] = { ...(bucket[id] || {}), ...data };
          }
        }),
      })),
      add: jest.fn(async (data: any) => {
        const bucket = (state as any)[name];
        if (Array.isArray(bucket)) bucket.push(data);
      }),
    })),
    __state: state,
  };

  return { adminDb, adminAuth: {} };
});

import { isoWeek, runWeeklyEventDigest } from '@/lib/services/weeklyEventDigest';
import { adminDb } from '@/lib/firebase/admin';

const state = (adminDb as any).__state;

function reset() {
  state.events.length = 0;
  state.members.length = 0;
  for (const k of Object.keys(state.notification_preferences)) delete state.notification_preferences[k];
  for (const k of Object.keys(state.digest_snapshots)) delete state.digest_snapshots[k];
  state.activity_logs.length = 0;
  jest.clearAllMocks();
  mockSendEmail.mockResolvedValue({ success: true, id: 'msg-1' });
  mockRenderPDF.mockResolvedValue(Buffer.from('%PDF-test'));
}

describe('isoWeek', () => {
  it('returns ISO week string', () => {
    expect(isoWeek(new Date('2026-01-05T12:00:00Z'))).toMatch(/^2026-W0[12]$/);
    expect(isoWeek(new Date('2026-05-04T12:00:00Z'))).toMatch(/^2026-W\d{2}$/);
  });
});

describe('runWeeklyEventDigest', () => {
  beforeEach(() => reset());

  it('sends nothing when there are no recipients', async () => {
    state.events.push({
      id: 'e1',
      title: 'Gala',
      slug: 'gala',
      date: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      status: 'published',
    });
    mockGetEventAttendees.mockResolvedValue({
      rows: [],
      totals: { members: 0, guests: 0, tickets: 0, revenueCents: 0, checkedIn: 0, totalAttendees: 0 },
    });

    const result = await runWeeklyEventDigest();
    expect(result.recipients).toBe(0);
    expect(result.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('attaches PDF for events within 14 days that have RSVPs', async () => {
    const now = new Date('2026-05-04T13:00:00Z');
    state.events.push({
      id: 'e1',
      title: 'Spring Gala',
      slug: 'spring-gala',
      date: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      status: 'published',
      location: 'UN Plaza',
    });
    state.members.push({
      id: 'm1',
      role: 'board',
      status: 'active',
      email: 'board@example.com',
      displayName: 'Board Member',
    });
    mockGetEventAttendees.mockResolvedValue({
      rows: [{
        id: 'r1', kind: 'member', name: 'A', email: 'a@x', phone: null,
        quantity: 1, amountCents: 0, paymentStatus: 'free', status: 'going',
        checkedIn: false, checkedInAt: null, tierId: null, createdAt: '2026-05-01',
      }],
      totals: { members: 1, guests: 0, tickets: 1, revenueCents: 0, checkedIn: 0, totalAttendees: 1 },
    });

    const result = await runWeeklyEventDigest({ now });
    expect(result.recipients).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.pdfsRendered).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendEmail.mock.calls[0][0];
    expect(callArgs.to).toBe('board@example.com');
    expect(callArgs.attachments).toHaveLength(1);
    expect(callArgs.attachments[0].filename).toMatch(/spring-gala/);
  });

  it('respects boardEventDigest=false opt-out', async () => {
    const now = new Date('2026-05-04T13:00:00Z');
    state.events.push({
      id: 'e1',
      title: 'Gala',
      slug: 'gala',
      date: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      status: 'published',
    });
    state.members.push({
      id: 'm1', role: 'treasurer', status: 'active',
      email: 'opt-out@example.com', displayName: 'Opt Out',
    });
    state.notification_preferences['m1'] = { boardEventDigest: false };
    mockGetEventAttendees.mockResolvedValue({
      rows: [],
      totals: { members: 0, guests: 0, tickets: 0, revenueCents: 0, checkedIn: 0, totalAttendees: 0 },
    });

    const result = await runWeeklyEventDigest({ now });
    expect(result.recipients).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('computes positive deltas vs the previous snapshot', async () => {
    const now = new Date('2026-05-04T13:00:00Z');
    state.events.push({
      id: 'e1', title: 'Gala', slug: 'gala',
      date: new Date(now.getTime() + 10 * 86_400_000).toISOString(),
      status: 'published',
    });
    state.members.push({
      id: 'm1', role: 'board', status: 'active',
      email: 'board@example.com', displayName: 'Board',
    });
    state.digest_snapshots['e1'] = {
      currentCounts: { totalAttendees: 5, members: 3, guests: 2, tickets: 5, revenueCents: 5000, checkedIn: 0 },
    };
    mockGetEventAttendees.mockResolvedValue({
      rows: [],
      totals: { members: 5, guests: 5, tickets: 12, revenueCents: 12000, checkedIn: 0, totalAttendees: 10 },
    });

    const result = await runWeeklyEventDigest({ now });
    expect(result.sent).toBe(1);
    const html = mockSendEmail.mock.calls[0][0].html as string;
    // Delta of 5 RSVPs (10 - 5) should appear
    expect(html).toMatch(/\+5/);
    // Snapshot rolled forward
    expect(state.digest_snapshots['e1'].currentCounts.totalAttendees).toBe(10);
    expect(state.digest_snapshots['e1'].previousCounts.totalAttendees).toBe(5);
  });

  it('marks recapSent for past events and skips repeat recaps', async () => {
    const now = new Date('2026-05-04T13:00:00Z');
    // Past event 3 days ago
    state.events.push({
      id: 'past1', title: 'Last week mixer', slug: 'last-week-mixer',
      date: new Date(now.getTime() - 3 * 86_400_000).toISOString(),
      status: 'published',
    });
    state.members.push({
      id: 'm1', role: 'board', status: 'active',
      email: 'board@example.com', displayName: 'Board',
    });
    mockGetEventAttendees.mockResolvedValue({
      rows: [],
      totals: { members: 4, guests: 1, tickets: 5, revenueCents: 0, checkedIn: 5, totalAttendees: 5 },
    });

    const r1 = await runWeeklyEventDigest({ now });
    expect(r1.pastEvents).toBe(1);
    expect(state.digest_snapshots['past1'].recapSent).toBe(true);

    // Second run: recap should NOT be sent again
    const r2 = await runWeeklyEventDigest({ now });
    expect(r2.pastEvents).toBe(0);
  });
});
