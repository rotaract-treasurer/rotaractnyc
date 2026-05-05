/**
 * Cron endpoint for the Weekly Event Digest.
 *
 * Triggered by Vercel Cron Mondays at 13:00 UTC (≈ 8 AM EST / 9 AM EDT).
 * Sends a single digest email per board recipient with attached attendee
 * PDFs for events happening in the next 14 days (and post-event recaps).
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header. Vercel Cron
 * sets this header automatically when CRON_SECRET is configured.
 */
export const dynamic = 'force-dynamic';
// Use the Node.js runtime — @react-pdf/renderer relies on Node APIs.
export const runtime = 'nodejs';
// Allow up to ~5 minutes; PDF rendering for large rosters can be slow.
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { runWeeklyEventDigest } from '@/lib/services/weeklyEventDigest';

function authorize(request: Request): boolean {
  const header = request.headers.get('authorization') ?? '';
  const token = header.replace('Bearer ', '');
  return !!process.env.CRON_SECRET && token === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWeeklyEventDigest();

    // Audit log
    try {
      await adminDb.collection('activity_logs').add({
        action: 'weekly_event_digest_cron',
        metadata: result,
        createdAt: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn('[weekly-event-digest] activity_logs write failed:', logErr);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[weekly-event-digest] Fatal cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    );
  }
}
