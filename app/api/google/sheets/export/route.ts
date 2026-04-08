/**
 * POST /api/google/sheets/export — export data to Google Sheets
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getGoogleSettings, updateGoogleSettings } from '@/lib/google/client';
import {
  ensureSpreadsheet,
  exportMembers,
  exportDues,
  exportEvents,
  exportAttendance,
  exportAllToSheets,
} from '@/lib/google/sheets';
import { getActiveMembers, getMembers } from '@/lib/services/members';
import { getAllEvents } from '@/lib/services/events';
import { getAllDuesForCycle, getActiveCycle } from '@/lib/services/dues';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const memberSnap = await adminDb.collection('members').doc(uid).get();
    const member = memberSnap.exists ? (memberSnap.data() as any) : null;
    if (!member || !['board', 'president', 'treasurer'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { exportType = 'all' } = body;

    const spreadsheetId = await ensureSpreadsheet();

    // Save spreadsheet ID to settings if not already saved
    const settings = await getGoogleSettings();
    if (!settings.sheetId || settings.sheetId !== spreadsheetId) {
      await updateGoogleSettings({ sheetId: spreadsheetId }, uid);
    }

    const result: { type: string; rowCount: number }[] = [];

    if (exportType === 'members' || exportType === 'all') {
      const members = await getMembers();
      await exportMembers(spreadsheetId, members);
      result.push({ type: 'members', rowCount: members.length });
    }

    if (exportType === 'dues' || exportType === 'all') {
      const cycle = await getActiveCycle();
      if (cycle) {
        const dues = await getAllDuesForCycle(cycle.id);
        // Enrich with member info
        const enriched = await Promise.all(
          dues.map(async (d) => {
            const m = await adminDb.collection('members').doc(d.memberId).get();
            const mData = m.exists ? (m.data() as any) : {};
            return {
              ...d,
              memberName: mData.displayName || d.memberId,
              memberEmail: mData.email || '',
            };
          }),
        );
        await exportDues(spreadsheetId, enriched);
        result.push({ type: 'dues', rowCount: enriched.length });
      }
    }

    if (exportType === 'events' || exportType === 'all') {
      const events = await getAllEvents();
      await exportEvents(spreadsheetId, events);
      result.push({ type: 'events', rowCount: events.length });
    }

    if (exportType === 'attendance' || exportType === 'all') {
      const rsvpSnap = await adminDb.collection('rsvps').orderBy('createdAt', 'desc').limit(1000).get();
      const rsvps = rsvpSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      // Enrich with event title
      const eventCache: Record<string, string> = {};
      const enriched = await Promise.all(
        rsvps.map(async (r: any) => {
          if (!eventCache[r.eventId]) {
            const e = await adminDb.collection('events').doc(r.eventId).get();
            eventCache[r.eventId] = e.exists ? (e.data() as any).title : r.eventId;
          }
          return { ...r, eventTitle: eventCache[r.eventId] };
        }),
      );
      await exportAttendance(spreadsheetId, enriched);
      result.push({ type: 'attendance', rowCount: enriched.length });
    }

    // Record the export
    await adminDb.collection('settings').doc('google-workspace').update({
      lastSheetsExport: new Date().toISOString(),
      lastSheetsExportBy: uid,
    });

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return NextResponse.json({
      message: 'Export complete!',
      spreadsheetId,
      url,
      exports: result,
    });
  } catch (error: any) {
    console.error('[POST /api/google/sheets/export]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
